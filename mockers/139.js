'use strict';
/**
 * 139邮箱登录
 */
var co = require('co');
var thunkify = require('thunkify');
var urllib = require('urllib');
var request = thunkify(urllib.request);
var fs = require('fs');
var xml = require('xml');
var _ = require('lodash');
var cookie = require('cookie');
var debug = require('debug')('139');
var Util = require('../lib/mail_139_lib');
var cookieParser = require('cookie-js');

function *doLogin(username,password){
  //处理username
  var email = username.split('@');
  username = email[0];
  var OLDDOMAIN = "139.com";
  var NEWDOMAIN = "10086.cn";
  var LIGHTSERVERDOMAIN = "images.139cm.com";
  var BehaviorLog = "http://smsrebuild1.mail." + NEWDOMAIN + "/weather/weather?func=user:logBehaviorAction";
  var https_Url = "http://mail." + NEWDOMAIN;
  var imagesCodeDomain = "imagecode.mail." + NEWDOMAIN;

  var _user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36';
  var __cookies = [];
  var _first = function (obj) {
    var k = _.first(_.keys(obj));
    return [k, obj[k]];
  };
  var _ckstr = function () {
    return _.uniq(__cookies)
      .map(function (c) {
        return _first(cookie.parse(c));
      })
      .map(function (c) {
        return cookie.serialize(c[0], c[1]);
      }).join('; ');
  };
  var _addck = function(response) {
    __cookies = __cookies.concat(response.headers['set-cookie'] || []);
  };

  var _getck = function(key){
    var cookieObj = cookieParser.parse(_ckstr());
    return cookieObj[key] ? cookieObj[key] : '';
  }

  var entry_url = https_Url + "/Login/Login.ashx";
  entry_url = Util.makeUrl(entry_url,'_',Util.sha1(username));
  entry_url = Util.makeUrl(entry_url,'resource','indexLogin');
  entry_url = Util.makeUrl(entry_url, "_fv", "4");
  entry_url = Util.makeUrl(entry_url, "cguid", Util.getCGUID());

  var login_data = {
    'Password':password,
    'UserName':username,
    'VerifyCode':'',
  }
  try{
    var res = yield request(entry_url,{
      method:'POST',
      data:login_data,
      headers:{
        'User-Agent':_user_agent
      },
      contentType:'text/html;charset=utf-8'
    });
  }catch(error){
    debug(error);
  }
  
  if(res){
    _addck(res[1]);
    try{
      var main_url = res[1]['headers']['location'];
      var main_res = yield request(main_url,{
        method:'GET',
        headers:{
          'User-Agent':_user_agent,
          'Cookie':_ckstr()
        }
      });
    }catch(error){
      debug(error);
    }

    if(main_res){
      _addck(main_res[1]);
    }

    var tmp_cookie = [];
    var a = entry_url.substr(entry_url.indexOf("cguid=") + 6, 13);
    var cookie_139_index_login = "_139_index_login=" + (new Date).getTime() + a + ";path=/;domain=mail." + NEWDOMAIN;
    tmp_cookie.push(cookie_139_index_login);
    __cookies = __cookies.concat(tmp_cookie || []);
  }

  var sid = _getck('Os_SSo_Sid');
  var sso_login_init_url = 'https://zone.mail.10086.cn/api/sso/ssoformail.ashx?to=CN201306B1&flag=6&sid='+sid;
  var sso_login_init_res;
  var sso_login_url = '';
  try{
    sso_login_init_res = yield request(sso_login_init_url,{
      method:'GET',
      headers:{
        'User-Agent':_user_agent,
        'Cookie':_ckstr()
      }
    });
    if(sso_login_init_res){
      sso_login_url = sso_login_init_res[1]['headers']['location'];
    }
    
  }catch(error){
    debug('stack:',error.stack);
  }

  var sso_login_res;
  if(sso_login_url){
    try{
      sso_login_res = yield request(sso_login_url,{
        method:'GET',
        header:{
          'User-Agent':_user_agent,
          'Cookie':_ckstr()
        }
      });
      if(sso_login_res){
        _addck(sso_login_res[1]);
        return _ckstr();
      }
    }catch(error){
      debug(error.stack);
    }
  }
  
  return;
}

module.exports = {
  getCookie:co.wrap(doLogin),
  test: function (str) {
    return /.*@139\.com?$/.test(str);
  }
}