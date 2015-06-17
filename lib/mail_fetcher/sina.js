'use strict';
/**
 * sina邮箱账单获取
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
var debug = require('debug')('sina');
var moment = require('moment');

var Fetcher = function(options){
  this.sid = '';
  this.mail_url = '';
  this.cookie = options.cookie || '';
  this.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36';
  this.date = options.date;
}

util.inherits(Fetcher, EventEmitter);

Fetcher.prototype.getList = function*(pageno){
  var self = this;
  var list_url = 'http://m0.mail.sina.com.cn/wa.php?a=list_mail';
  var post_data = {
    'fid':'new',
    'order':'htime',
    'sorttype':'desc',
    'type':0,
    'pageno':pageno,
    'tag':-1,
    'webmail':1
  }
  debug('post_data:',post_data);
  try{
    var res = yield request(list_url,{
      method:'POST',
      data:post_data,
      headers:{
        'Cookie':self.cookie,
        'User-Agent':self.user_agent
      }
    });
    var json_string = res[0].toString();
    var json_obj = eval("(" + json_string + ")");
    return json_obj['data']['maillist'];
  }catch(e){
    throw e;
    return;
  }

  return '';
}

Fetcher.prototype.getContent = function *(){
  var start = 1;
  while(true){
    debug('start:',start);
    var self = this;
    try{
      var item_list = yield this.getList(start);
    }catch(error){
      self.emit('error',error);
      debug('获取列表失败:',error);
      return;
    }
    
    debug('item_list:',item_list);
    if(item_list){
      if(_.size(item_list) == 0){
        this.emit('end','暂时没有新的账单邮件');
        return;
      }
      //循环处理数据 -- 分页循环
      var stop = false;
      for(let i of item_list){
        var mid = i[0];
        var from = i[1];
        var to = i[2];
        var subject = i[3];
        var date = i[4] * 1000;

        //判断时间
        if(moment(this.date).format('YYYY-MM-DD') > moment(date).format('YYYY-MM-DD')){
          this.emit('end','暂时没有新的账单邮件');
          stop = true;
          return;
        }
        debug('mail date:',moment(date).format('YYYY-MM-DD'));
        debug('mail subject:',subject);
        var email = {};
        email['subject'] = subject;
        email['date'] = date;
        var read_url = 'http://m0.mail.sina.com.cn/classic/readmail.php';
        var read_params = {
          'webmail':'1',
          'fid':'new',
          'mid':mid,
          'ts':16603
        }

        read_url = [read_url,querystring.encode(read_params)].join('?');
        debug('read_url:',read_url);
        try{
          var read_res = yield self.getHtml(read_url);
          if(read_res[0]){
            read_res = JSON.parse(read_res[0].toString());
            email['content'] = read_res['data']['body'];
          }else{
            email['content'] = '';
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
      stop = true;
      break;
      return;
    }
    start += 1;
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
    return /.*@sina\.com?$/.test(str);
  }
}