'use strict';
/**
 * yeah邮箱账单获取
 */
var co = require('co');
var urllib = require('urllib');
var thunkify = require('thunkify');
var request = thunkify(urllib.request);
var cookieParser = require('cookie-js');
var querystring = require('querystring');
var XML = require('xml');
var Xml2json = require('xml2json');
var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('yeah');
var moment = require('moment');

var Fetcher = function(options){
  this.sid = '';
  this.mail_url = '';
  this.cookie = options.cookie || '';
  this.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36';
  this.date = options.date;
}

util.inherits(Fetcher, EventEmitter);

Fetcher.prototype.getCookieValue = function*(key){
  var self = this;
  var cookieObj = cookieParser.parse(self.cookie);
  return cookieObj[key] ? cookieObj[key] : '';
};

Fetcher.prototype.getList = function*(start,limit){
  var self = this;
  var sid = yield self.getCookieValue('Coremail.sid');
  self.sid = sid;
  var list_url = 'http://mail.yeah.net/js6/s?sid='+sid+'&func=mbox:listMessages&LeftNavfolder1Click=1&mbox_folder_enter=1';
  var xml_data = [
              { object: [
                {'int':[{_attr:{'name':'fid'}},1]},
                {'string':[{_attr:{'name':'order'}},'date']},
                {'boolean':[{_attr:{'name':'desc'}},true]},
                {'int':[{_attr:{'name':'limit'}},limit]},
                {'int':[{_attr:{'name':'start'}},start]},
                {'boolean':[{_attr:{'name':'skipLockedFolders'}},false]},
                {'string':[{_attr:{'name':'topFlag'}},'top']},
                {'boolean':[{_attr:{'name':'returnTag'}},true]},
                {'boolean':[{_attr:{'name':'returnTotal'}},true]}
                ]
              } 
            ];
  xml_data = XML(xml_data,{ declaration: true });
  var post_data = {
    'var':xml_data
  };
  try{
    var list_res = yield request(list_url,{
      method:'POST',
      data:post_data,
      headers:{
        'Cookie':self.cookie,
        'User-Agent':self.user_agent
      }
    });
    
    var xml = list_res[0].toString();
    var json = Xml2json.toJson(xml,{'object':true});
    var result = [];
    _.forEach(json['result']['array']['object'],function(i){
      var res = {};
      res[i['string']['0']['name']] = i['string'][0]['$t'];
      res[i['string'][1]['name']] = i['string'][1]['$t'];
      res[i['string'][2]['name']] = i['string'][2]['$t'];
      res[i['string'][3]['name']] = i['string'][3]['$t'];
      res[i['date'][0]['name']] = i['date'][0]['$t'];
      result.push(res);
    });

    return result;
  }catch(e){
    throw e;
  }
}

Fetcher.prototype.getContent = function *(){
  var start = 0;
  var limit = 50;
  while(true){
    debug('start:',start);
    var self = this;
    try{
      var item_list = yield this.getList(start,limit);
    }catch(error){
      self.emit('error',error);
      debug('获取列表失败:',error);
      return;
    }
    
    if(item_list){
      if(_.size(item_list) == 0){
        this.emit('end','暂时没有新的账单邮件');
        return;
      }

      //循环处理数据 -- 分页循环
      var stop = false;
      for(let i of item_list){
        //判断时间
        if(moment(this.date).format('YYYY-MM-DD') > moment(i['sentDate']).format('YYYY-MM-DD')){
          this.emit('end','暂时没有新的账单邮件');
          stop = true;
          return;
        }
        debug('mail date:',moment(i['sentDate']).format('YYYY-MM-DD'));
        debug('mail subject:',i['subject']);
        var email = {};
        email['subject'] = i['subject'];
        email['date'] = i['sentDate'];
        var read_url = 'http://mail.yeah.net/js6/read/readhtml.jsp';
        var read_params = {
          'mid':i['id'],
          'font':'15',
          'color':'1D6CA3'
        }

        read_url = [read_url,querystring.encode(read_params)].join('?');
        debug('read_url:',read_url);
        try{
          var read_res = yield self.getHtml(read_url);
          email['content'] = read_res[0].toString();
          self.emit('message',email);
        }catch(e){
          self.emit('error',e);
          return;
        }
      }
      if(stop){
        break;
      }
    }else{
      self.emit('error',new Error('邮箱没有邮件'));
      break;
    }
    start += limit;
  }
}

Fetcher.prototype.getHtml = function *(url){
  var self = this;
  try{
    var read_res = yield request(url,{
      method:'GET',
      headers:{
        'Cookie':self.cookie,
        'User-Agent':self.user_agent
      },
      timeout:100000
    });
    return read_res;
  }catch(e){
    debug('message:',e.message);
    debug('code:',e.code);
    self.emit('error',e);
    return;
  }
}

module.exports = {
  'Fetcher':Fetcher,
  'test':function(str){
    return /.*@yeah\.net?$/.test(str);
  }
}