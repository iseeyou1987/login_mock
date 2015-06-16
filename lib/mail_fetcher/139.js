'use strict';
/**
 * 139邮箱账单获取
 */
var co = require('co');
var urllib = require('urllib');
var thunkify = require('thunkify');
var request = thunkify(urllib.request);
var querystring = require('querystring');
var cookieParser = require('cookie-js');
var XML = require('xml');
var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Util_139 = require('../mail_139_lib');
var debug = require('debug')('139');
var fs = require('fs');

var Fetcher = function(options){
  this.sid = '';
  this.mail_url = '';
  this.cookie = options.cookie || '';
  this.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36';
}

util.inherits(Fetcher, EventEmitter);

Fetcher.prototype.getCookieValue = function*(key){
  var self = this;
  var cookieObj = cookieParser.parse(self.cookie);
  return cookieObj[key] ? cookieObj[key] : 'asd';
}

Fetcher.prototype.getList = function*(){
  var self = this;
  
  var sid = yield self.getCookieValue('Os_SSo_Sid');
  self.sid = sid;

  var xml_data = [
                { object: [
                  {'int':[{_attr:{'name':'fid'}},1]},
                  {'string':[{_attr:{'name':'order'}},'receiveDate']},
                  {'string':[{_attr:{'name':'desc'}},1]},
                  {'int':[{_attr:{'name':'total'}},20]},
                  {'int':[{_attr:{'name':'start'}},0]},
                  {'string':[{_attr:{'name':'topFlag'}},'top']},
                  {'int':[{_attr:{'name':'sessionEnable'}},2]}
                  ]
                }
              ];
  xml_data = XML(xml_data,{ declaration: false });
  var list_url = 'https://appmail.mail.10086.cn/s?func=mbox:listMessages&sid='+sid+'&&comefrom=54&cguid='+Util_139.getCGUID();

  try{
    var list_res = yield request(list_url,{
      method:'POST',
      content:new Buffer(xml_data,'utf-8'),
      contentType:'application/xml',
      headers:{
        'Cookie':self.cookie,
        'User-Agent':self.user_agent
      }
    });

    var json_obj;
    var json_string = list_res[0].toString();
    if(json_string){
      json_obj = eval("(" + json_string + ")");
      if(json_obj['var']){
        return json_obj['var'];
      }
    }
    return '';

  }catch(e){
    throw e;
    return;
  }

  return '';
}

Fetcher.prototype.getContent = function *(){
  while(true){
    try{
      var item_list = yield this.getList();
    }catch(error){
      debug('获取列表失败:',error);
    }
    
    var self = this;
    debug(item_list);

    if(item_list){
      //循环处理数据 -- 分页循环
      for(let i of item_list){

        var email = {};
        email['subject'] = i['subject'];
        email['date'] = i['sentDate'];
        email['from'] = i['from'];
        email['to'] = i['to'];
        var read_url = 'https://appmail.mail.10086.cn/RmWeb/view.do';
        var read_params = {
          'func':'view:readMessage',
          'comefrom':54,
          'sid':self.sid,
          'cguid':Util_139.getCGUID(),
          'mid':i['mid'],
          'callback':'readMailReady',
          'fid':1
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
    return /.*@139\.com?$/.test(str);
  }
}