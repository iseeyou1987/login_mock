'use strict';
/**
 * sohu邮箱账单获取
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
var debug = require('debug')('sohu_fetcher');
var moment = require('moment');

var Fetcher = function(options){
  this.sid = '';
  this.mail_url = '';
  this.cookie = options.cookie || '';
  this.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36';
  this.date = options.date;
}

util.inherits(Fetcher, EventEmitter);

Fetcher.prototype.getList = function*(start,limit){
  var self = this;
  var list_data = {
    'start':start,
    'length':limit,
    'sort':'date',
    'order':0
  }

  var list_url = 'http://mail.sohu.com/bapp/174/folder/1';
  list_url = [list_url, querystring.encode(list_data)].join('?');

  try{
    var res = yield request(list_url,{
      method:'GET',
      headers:{
        'Host': 'mail.sohu.com',
        'Cookie':self.cookie,
        'User-Agent':self.user_agent
      }
    });
    res = res[0].toString();
    res = JSON.parse(res);
    return res;
  }catch(e){
    throw e;
  }

  return '';
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
      break;
    }
    
    if(item_list){
      if(_.size(item_list) == 0){
        this.emit('end','暂时没有新的账单邮件');
        return;
      }
      //循环处理数据 -- 分页循环
      var stop = false;
      for(let i of item_list){
        debug('id:',i['rowid']);
        //判断时间
        if(moment(this.date).format('YYYY-MM-DD') > moment( Date.parse(i['envelope']['date'])).format('YYYY-MM-DD')){
          this.emit('end','暂时没有新的账单邮件');
          stop = true;
          return;
        }
        debug('mail date:',moment(i['sentDate']).format('YYYY-MM-DD'));
        debug('mail subject:',i['subject']);
        var email = {};
        email['from'] = i['envelope']['from'][0][1];
        email['to'] = i['envelope']['to'][0][1];
        email['subject'] = i['envelope']['subject'];
        email['date'] = Date.parse(i['envelope']['date']);
        var read_url = 'http://mail.sohu.com/bapp/174/mail/'+i['rowid'];
        debug('read_url:',read_url);
        try{
          var read_res = yield self.getHtml(read_url);
          read_res = read_res[0].toString();
          read_res = JSON.parse(read_res);
          if(read_res['maximum'] && read_res['maximum'] != ''){
            var download_url = 'http://mail.sohu.com/bapp/174/download/'+read_res['maximum']+'.7';
            var download_content = yield self.getDownload(download_url);
            email['content'] = download_content.toString();
          }else{
            email['content'] = read_res['display'];
          }
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
  var read_res;
  try{
    read_res = yield request(url,{
      method:'GET',
      headers:{
        'Cookie':self.cookie,
        'User-Agent':self.user_agent
      },
      timeout:100000
    });
    return read_res;
    read_res = JSON.parse(read_res);
  }catch(e){
    debug('message:',e.message);
    debug('code:',e.code);
    self.emit('error',e);
    throw e;
  }
}

Fetcher.prototype.getDownload = function *(url){
  var self = this;
  var read_res;
  try{
    read_res = yield request(url,{
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
    throw e;
  }
}

module.exports = {
  'Fetcher':Fetcher,
  'test':function(str){
    return /.*@sohu\.com?$/.test(str);
  }
}