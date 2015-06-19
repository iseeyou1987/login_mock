'use strict';
/**
 * QQ邮箱账单获取
 */
var co = require('co');
var urllib = require('urllib');
var thunkify = require('thunkify');
var request = thunkify(urllib.request);
var querystring = require('querystring');
var cookieParser = require('cookie-js');
var XML = require('xml');
var Xml2json = require('xml2json');
var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('qq_fetcher');
var moment = require('moment');
var jsdom = require('jsdom');
var $ = require('jquery')(jsdom.jsdom().parentWindow);
var iconv = require('iconv-lite');

var Fetcher = function(options){
  this.sid = '';
  this.mail_url = '';
  this.cookie = options.cookie || '';
  this.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36';
  this.date = options.date;
};

util.inherits(Fetcher, EventEmitter);

Fetcher.prototype.getCookieValue = function*(key){
  var self = this;
  var cookieObj = cookieParser.parse(self.cookie);
  return cookieObj[key] ? cookieObj[key] : '';
};

Fetcher.prototype.getList = function*(page){
  var self = this;
  self.sid = yield self.getCookieValue('Location_sid');
  var list_param = {
    'sid':self.sid,
    'folderid':1,
    'folderkey':1,
    'page':page,
    's':'inbox',
    'topmails':0,
    'showinboxtop':1,
    'ver':'417634.0',
    'cachemod':'maillist',
    'cacheage':'7200',
    'r':'',
    'selectall':0
  };
  var list_url = 'http://set3.mail.qq.com/cgi-bin/mail_list';
  var res;
  list_url = [list_url, querystring.encode(list_param)].join('?');
  debug(list_url);
  try{
    res = yield request(list_url,{
      method:'GET',
      headers:{
        'Cookie':self.cookie,
        'User-Agent':self.user_agent
      },
      timeout:'10000'
    });
    res = iconv.decode(res[0],'GBK');
    var $dom = $(res);
    res = $dom.find('div#div_showbefore > table.i');
    if(res.length <= 0){
      return '';
    }
    var list = [];
    res.each(function(i){
      var obj = $(this);
      var obj_con = {};
      obj_con['mailid'] = obj.find('input[name="mailid"]').val();
      obj_con['subject'] = $.trim(obj.find('u.black').text());
      list.push(obj_con);
    });

    return list;
  }catch(e){
    throw e;
  }
};

Fetcher.prototype.getContent = function *(){
  var start = 0;
  var self = this;
  while(true){
    debug('start:',start);
    try{
      var item_list = yield this.getList(start);
    }catch(error){
      self.emit('error',error);
      debug('获取列表失败:',error);
      return;
    }
    
    if(item_list){
      //循环处理数据 -- 分页循环
      var stop = false;
      for(let i of item_list){
        var email = {};
        var read_url = 'http://set3.mail.qq.com/cgi-bin/readmail';
        var read_params = {
          'folderid':1,
          'folderkey':1,
          't':'readmail',
          'mailid':i['mailid'],
          'mode':'pre',
          'maxage':3600,
          'base':'12.3',
          'ver':14172,
          'sid':self.sid
        };

        read_url = [read_url,querystring.encode(read_params)].join('?');
        debug('==============================');
        debug('read_url:',read_url);
        try{
          var read_res = yield self.getHtml(read_url);
          var res = iconv.decode(read_res[0],'GBK');
          var $dom = $(res);
          var content = $dom.find('div#mailContentContainer').html();
          var date = $dom.find('div#mainmail > div.readmailinfo > table > tbody > tr > td.settingtable > b.tcolor').text();
          var match = date.match(/[0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日/g);
          date = match[0].replace(/([0-9]{4})年([0-9]{1,2})月([0-9]{1,2})日/g,'$1-$2-$3');
          //判断时间
          if(moment(this.date).format('YYYY-MM-DD') > moment(Date.parse(date)).format('YYYY-MM-DD')){
            this.emit('end','暂时没有新的账单邮件');
            stop = true;
            return;
          }
          email['content'] = content;
          email['date'] = date;
          email['subject'] = i['subject'];
          debug('date:',email['date']);
          debug('subject:',email['subject']);
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
    return /.*@qq\.com?$/.test(str);
  }
}