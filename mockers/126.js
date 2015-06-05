'use strict';
/**
 * 126邮箱登录
 */
var co = require('co');
var thunkify = require('thunkify');
var urllib = require('urllib');
var request = thunkify(urllib.request);
var fs = require('fs');
var xml = require('xml');
var _ = require('lodash');
var cookie = require('cookie');
var xml2js = require('xml2js');
var parseString = thunkify(xml2js.parseString);

function *doLogin(username,password){
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
        return cookie.serialize(c[0], c[1],{'encode':function(val){return val}});
      }).join('; ');
  };
  var _addck = function (response) {
    __cookies = __cookies.concat(response.headers['set-cookie'] || []);
  };

  var entry_url = "https://mail.126.com/entry/cgi/ntesdoor?df=mail126_letter&from=web&funcid=loginone&iframe=1&language=-1&passtype=1&product=mail126&verifycookie=-1&net=failed&style=-1&race=-2_-2_-2_db&uid="+username+"&hid=10010102";
  var login_data = {
    'username':username,
    'password':password
  }
  var res = yield request(entry_url,{
    method:'POST',
    data:login_data,
    contentType:'text/html;charset=utf-8'
  });

  //==========================登录成功--获取跳转信息
  var redirect_url = res[0].toString();
  var match_res = redirect_url.match(/top.location.href = "(.*?)"/g);
  if(match_res == null){
    throw new Error('登录失败,账号或者密码错误！');
    return ;
  }
  var mail_url = match_res[0].replace(/top.location.href = "(.*?)"/g,'$1');
  var headers = res[1].headers;
  _addck(res[1]);

  var res = yield request(mail_url,{
    method:'GET',
    headers:{
      Referer: 'http://mail.126.com/entry/cgi/ntesdoor?df=loginjustnowmail126&funcid=loginjustnow&iframe=1',
      Host: 'mail.126.com',
      Cookie: _ckstr(),
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36'
    }
  });

  //邮箱主页html--获取sid
  var index_html = res[0].toString();
  _addck(res[1]);

  return _ckstr();
}

module.exports = {
  getCookie:co.wrap(doLogin),
  test: function (str) {
    return /.*@126\.com?$/.test(str);
  }
}