'use strict';

/**
 * 搜狐邮箱登录
 */
var co = require('co');
var thunkify = require('thunkify');
var urllib = require('urllib');
var request = thunkify(urllib.request);
var fs = require('fs');
var readFile = thunkify(fs.readFile);
var writeFile = thunkify(fs.writeFile);
var _ = require('lodash');
var cookie = require('cookie');
var queryString = require('querystring');
var sohuEncryption = require('../lib/sohuEncryption');
var readline = require('readline');

function *doLogin(username,password){
  if(!username || !password){
    return false;
  }

  var password = sohuEncryption.hex_md5(password);

	var _user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36';
  var __cookies = [];
  var _ckstr = function () {
    return _.uniq(__cookies)
      .map(function (c) {
        return _first(cookie.parse(c));
      })
      .map(function (c) {
        try{
          var encode = function(val){
            return val;
          }
          return cookie.serialize(c[0], c[1],{'encode':encode});
        }catch(error){
          console.log(error);
        }
        
      }).join('; ');
  };
  var _addck = function (response) {
    __cookies = __cookies.concat(response.headers['set-cookie'] || []);
  };


  var _first = function (obj) {
    var k = _.first(_.keys(obj));
    return [k, obj[k]];
  };

  var userid = username.split('@');
  userid = userid[0];
  //cardlog
  var cardlog_url = 'http://passport.sohu.com/web/cardlog.jsp';
  var card_log_data = {
    'desc':'beginLogin',
    'loginProtocal':'https',
    'userid':userid,
    'appid':'1113',
    'browserType':7,
    'status':'',
    'count':0,
    'max':100,
    'flag':0,
  }

  cardlog_url = [cardlog_url,queryString.encode(card_log_data)].join('?');

  try{
    var card_log_res = yield request(cardlog_url,{
      method:'GET',
      headers:{
        'User-agent':_user_agent,
        'Host':'passport.sohu.com',
        'Referer':'http://mail.sohu.com/'
      }
    });
  }catch(err){
    console.log(err.stacks);
  }
  
  var login_url = 'https://passport.sohu.com/sso/login.jsp';
  var login_data = {
    'userid':username,
    'password':password,
    'appid':'1113',
    'persistentcookie':0,
    's':'1432520741286',
    'b':7,
    'w':1920,
    'pwdtype':1,
    'v':26
  }
  
  try{
    login_url = [login_url, queryString.encode(login_data)].join('?');
    var login_res = yield request(login_url,{
      method:'GET',
      headers:{
        'Host':'passport.sohu.com',
        'User-agent':_user_agent
      }
    });

    if(login_res[0].toString().match(/error3/)){
      console.error('登录密码错误');
      return false;
    }else if(login_res[0].toString().match(/error2/)){
      console.error('登录密码错误');
      return false;
    }else if(login_res[0].toString().match(/error5/)){
      console.error('暂时不可登录，请稍后重试');
      return false;
    }else if(login_res[0].toString().match(/error11/)){
      console.error('服务器故障，请稍候再试');
      return false;
    }
  }catch(err){
    console.log(err.stack);
    return false;
  }
  _addck(login_res[1]);

  //List Mail
  var mail_url = 'http://mail.sohu.com/bapp/174/main';
  var mail_res = yield request(mail_url,{
    method:"GET",
    headers:{
      'Cookie':_ckstr(),
      'Host':'mail.sohu.com',
      'Referer':'http://mail.sohu.com',
      'User-agent':_user_agent
    }
  });

  _addck(mail_res[1]);

  return _ckstr();
}

module.exports = {
	getCookie:co.wrap(doLogin),
  test: function (str) {
    return /.*@sohu\.com?$/.test(str);
  }
}