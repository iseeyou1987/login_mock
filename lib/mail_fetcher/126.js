'use strict';
/**
 * 126邮箱账单获取
 */
var co = require('co');
var urllib = require('urllib');
var thunkify = require('thunkify');
var request = thunkify(urllib.request);
var querystring = require('querystring');
var XML = require('xml');
var Xml2json = require('xml2json');
var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Fetcher = function(options){
  this.sid = '';
  this.mail_url = '';
  this.cookie = options.cookie || '';
  this.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36';
}

util.inherits(Fetcher, EventEmitter);

Fetcher.prototype.getList = function*(){
  var self = this;
  var list_url = 'http://mail.126.com/entry/cgi/ntesdoor?df=loginjustnowmail126&funcid=loginjustnow&iframe=1:9';
  try{
    var res = yield request(list_url,{
      method:'GET',
      headers:{
        'Host': 'mail.126.com',
        'Cookie':self.cookie,
        'User-Agent':self.user_agent
      }
    });
  }catch(e){
    throw e;
    return;
  }

  if(!res[1].headers['location']){
    throw new Error('进入邮箱失败！');
    return ;
  }else{
    var main_url = self.main_url = res[1].headers['location'];
    var params = querystring.parse(main_url.split('?')[1]);
    var sid = self.sid = params['sid'];
    var list_url = 'http://mail.126.com/js6/s?sid='+sid+'&func=mbox:listMessages&LeftNavfolder1Click=1&mbox_folder_enter=1';
    var xml_data = [
                { object: [
                  {'int':[{_attr:{'name':'fid'}},1]},
                  {'string':[{_attr:{'name':'order'}},'date']},
                  {'boolean':[{_attr:{'name':'desc'}},true]},
                  {'int':[{_attr:{'name':'limit'}},100]},
                  {'int':[{_attr:{'name':'start'}},0]},
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
    }
    try{
      var main_res = yield request(list_url,{
        method:'POST',
        data:post_data,
        headers:{
          'Cookie':self.cookie,
          'Referer':main_url,
          'User-Agent':self.user_agent
        }
      });
      
      var xml = main_res[0].toString();
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
      return;
    }
  }
  
  return '';
}

Fetcher.prototype.getContent = function *(){
  while(true){
    var item_list = yield this.getList();
    var self = this;

    if(item_list){
      //循环处理数据 -- 分页循环
      for(let i of item_list){
        var email = {};
        email['subject'] = i['subject'];
        email['date'] = i['sentDate'];
        var read_url = 'http://mail.126.com/js6/read/readhtml.jsp';
        var read_params = {
          'mid':i['id'],
          'font':'15',
          'color':'1D6CA3'
        }

        read_url = [read_url,querystring.encode(read_params)].join('?');

        try{
          var read_res = yield self.getHtml(read_url);
          email['content'] = read_res[0].toString();
          self.emit('message',email);
        }catch(e){
          self.emit('error',e);
          return;
        }
      }
      break;
    }else{
      self.emit('error',new Error('邮箱没有邮件'));
      break;
    }
  }
}

Fetcher.prototype.getHtml = function *(url){
  var self = this;
  try{
    var read_res = yield request(url,{
      method:'GET',
      headers:{
        'Cookie':self.cookie,
        'Referer':self.main_url,
        'User-Agent':self.user_agent
      }
    });
    return read_res;
  }catch(e){
    self.emit('error',e);
    return;
  }
}

module.exports = {
  'Fetcher':Fetcher,
  'test':function(str){
    return /.*@126\.com?$/.test(str);
  }
}