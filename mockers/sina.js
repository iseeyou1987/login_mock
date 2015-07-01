'use strict';

var _ = require('lodash');
var urllib = require('urllib');
var thunkify = require('thunkify');
var co = require('co');
var queryString = require('querystring');
var iconv = require('iconv-lite');
var cookie = require('cookie');
var debug = require('debug')('sina');

var request = thunkify(urllib.request);
var sinaSSOEncoder = require('./../lib/sinaSSOEncoder');

function *getCookie(username, password) {
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
  var _addck = function (response) {
    if(typeof response.headers == 'object' && response.headers.hasOwnProperty('set-cookie')){
      __cookies = __cookies.concat(response.headers['set-cookie'] || []);
    }
  };

  // login
  var plgUrl = 'http://login.sina.com.cn/sso/prelogin.php';
  var preArr = {
    entry: 'cnmail',
    su: sinaSSOEncoder.base64.encode(encodeURIComponent(username)),
    rsakt: 'mod'
  };
  plgUrl = [plgUrl, queryString.encode(preArr)].join('?');
  var preResult = yield request(plgUrl);
  preResult = JSON.parse(_.first(preResult).toString());
  debug('pre login result:\n %j \n', preResult);
  if(preResult['retcode'] == 101){
    throw new Error(preResult['reason']);
    return;
  }
  var lgUrl = 'http://login.sina.com.cn/sso/login.php?client=ssologin.js(v1.4.18)&_=' + (+new Date());
  var makePassword = function () {
    var RSAKey = new sinaSSOEncoder.RSAKey();
    RSAKey.setPublic(preResult.pubkey, "10001");
    return RSAKey.encrypt([preResult.servertime, preResult.nonce].join("\t") + "\n" + password);
  };
  var loginArr = {
    entry: 'freemail',
    gateway: 1,
    from: '',
    savestate: 0,
    useticket: 0,
    pagerefer: '',
    su: preArr.su,
    service: 'sso',
    servertime: preResult.servertime,
    nonce: preResult.nonce,
    pwencode: 'rsa2',
    rsakv: preResult.rsakv,
    sp: makePassword(),
    sr: 1440 * 900,
    encoding: 'UTF-8',
    cdult: 3,
    domain: 'sina.com.cn',
    prelt: 74,
    returntype: 'TEXT'
  };
  debug('login array:\n %j \n', loginArr);
  var loginResults = yield request(lgUrl, {
    method: 'POST',
    data: loginArr,
    dataType: 'application/x-www-form-urlencoded'
  });
  debug('login header:\n %j \n', loginResults[1].headers);
  var ret = JSON.parse(loginResults[0].toString());
  debug('login result:\n %j \n', ret);
  if(ret['retcode'] == 101){
    throw new Error(ret['reason']);
    return;
  }
  _addck(loginResults[1]);
  if (ret.retcode !== '0' || !ret.uid) {
    return false;
  }

  // add crossDomainUrl cookies
  var domainResults = yield (ret.crossDomainUrlList || []).map(function (l) {
    return request(l);
  });
  domainResults.forEach(function (c) {
    _addck(c[1]);
  });

  // add sla cookies
  var slaUrl = 'http://mail.sina.com.cn/cgi-bin/sla.php';
  var slaResults = yield request(slaUrl, {
    method: 'GET',
    headers: {
      Referer: 'http://mail.sina.com.cn/?from=mail',
      Host: 'mail.sina.com.cn',
      Cookie: _ckstr(),
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36'
    },
    data: {
      a: +new Date(),
      b: +new Date() + 480,
      c: 0
    }
  });
  _addck(slaResults[1]);

  // 终于找到你
  var xxUrl = slaResults[1].headers.location;
  var xxResults = yield request(xxUrl, {
    method: 'GET',
    headers: {
      Cookie: _ckstr()
    }
  });
  _addck(xxResults[1]);

  var listUrl = 'http://m0.mail.sina.com.cn/wa.php?a=list_mail';
  var listResults = yield request(listUrl, {
    method: 'POST',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Origin: 'http://m0.mail.sina.com.cn',
      Referer: 'http://m0.mail.sina.com.cn/classic/index.php',
      Cookie: _ckstr()
    },
    timeout:10000,
    data: {
      c: +new Date(),
      d: (+new Date()) + 240,
      fid: 'new',
      order: 'htime',
      sorttype: 'desc',
      type: 0,
      pageno: 1,
      tag: -1,
      webmail: 1
    }
  });
  debug('final cookie: \n %s \n', _ckstr());
  return _ckstr();
}

module.exports = {
  getCookie: getCookie,
  test: function (str) {
    return /.*@sina\.com(\.cn)?$/.test(str);
  }
};