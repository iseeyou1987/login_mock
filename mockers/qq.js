'use strict';
/**
 * QQ邮箱登录
 * @type {[type]}
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
var Encryption = require('../lib/qqEncryption');
var readline = require('readline');
var debug = require('debug')('qq_login');

//用户输入的验证码
var set_captcha_code = function (callback){
  return new Promise(function (resolve, reject) {
    var captcha_code = setInterval(function(){
      co(function *(){
        try{
          var res = yield readFile('./captcha.json');
          res=res.toString();
          res = JSON.parse(res.toString());
          if(!res['code']){
            debug('Waitng input captcha');
          }else{
            clearInterval(captcha_code);
            resolve(res['code']);
          }
        }catch(err){
          debug(err.stack);
        }
      });
    },100);
  });
};

function *doLogin(username,password){
  var email = username.split('@');
  username = email[0];

  var _user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36';
  var _pt_login_sig = '';
  var _verifycode = '';
  var _pt_verifysession_v1 = '';
  var _p = '';
  var _salt = '';
  var _status = 0;
  var redirect_url = '';
  var image_url = '';
  var __cookies = [];

  var _first = function (obj) {
    var k = _.first(_.keys(obj));
    return [k, obj[k]];
  };

  var ptui_checkVC = function(a, d, b, f, c){
    _salt = b;

    switch(a){
      case "1":
        _status  = a;
        //需要做验证码处理
        image_url = 'https://ssl.captcha.qq.com/getimage?uin='+username+'&aid=522005705&cap_cd='+d+'&'+Math.random();
        break;
      default:
        _pt_verifysession_v1 = f;
        _verifycode = d;
        try{
          _p = Encryption.getEncryption(password, _salt, _verifycode, false);
        }catch(err){
          debug('ptui_checkVC Error:',err.stack);
        }
        break;
    }
  };

  var ptuiCB = function(l, o, b, k, d, a){
    redirect_url = b;
  };

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
          debug('_ckstr Error:',error.stack);
        }
        
      }).join('; ');
  };
  var _addck = function (response) {
    __cookies = __cookies.concat(response.headers['set-cookie'] || []);
  };

  var _set_login_sig = function(){
    try{
      _.forEach(__cookies,function(i){
        var i = cookie.parse(i);
        if(i['pt_login_sig'] !== undefined){
          _pt_login_sig = i['pt_login_sig'];
        }
      });
    }catch(err){
      debug('_set_login_sig Error:',err.stack);
    }
  };

  var _set_verifysession = function(){
    try{
      _.forEach(__cookies,function(i){
        var i = cookie.parse(i);
        if(i['verifysession'] !== undefined){
          _pt_verifysession_v1 = i['verifysession'];
        }
      });
    }catch(err){
      debug('_set_verifysession Error:',err.stack);
    }
  };

  
  /**
   * 第一次请求登录页面
   */
  var ptlogin_url = 'https://xui.ptlogin2.qq.com/cgi-bin/xlogin?appid=522005705&daid=4&s_url=https://mail.qq.com/cgi-bin/login?vt=passport%26vm=wpt%26ft=loginpage%26target=&style=25&low_login=1&proxy_url=https://mail.qq.com/proxy.html&need_qr=0&hide_border=1&border_radius=0&self_regurl=http://zc.qq.com/chs/index.html?type=1&app_id=11005?t=regist&';
  try{
    var res = yield request(ptlogin_url,{
      method:'GET',
      headers:{
        'Host':'xui.ptlogin2.qq.com',
        'User-Agent':_user_agent
      }
    });
  }catch(err){
    debug('第一次请求登录页面 Error:',err.stack);
    return false;
  }
  _addck(res[1]);
  _set_login_sig();


  /**
   * QQ Check操作
   */
  var check_data = {
    'regmaster':'',
    'pt_tea':1,
    'pt_vcode':0,
    'uin':username,
    'appid':'522005705',
    'js_ver':'10123',
    'js_type':1,
    'login_sig':_pt_login_sig,
    'u1':'https://mail.qq.com/cgi-bin/login?vt=passport&vm=wpt&ft=loginpage&target=',
    'r':Math.random()
  };
  var check_url = 'https://ssl.ptlogin2.qq.com/check';
  check_url = [check_url, queryString.encode(check_data)].join('?');
  var res = yield request(check_url,{
    method:'GET',
    headers:{
      'Referer':ptlogin_url,
      'Host':'ssl.ptlogin2.qq.com',
      'Cookie':_ckstr(),
      'User-Agent':_user_agent
    },
    timeout:10000
  });
  _addck(res[1]);

  try{
    //对check结果做判断 - ptui_checkVC()
    eval(res[0].toString());

    if(image_url && _status){
      try{
        var image_res = yield request(image_url,{
          method:'GET',
          headers:{
            'Host':'ssl.captcha.qq.com',
            'User-Agent':_user_agent
          }
        });
      }catch(err){
        debug('对check结果做判断 Error:',err.stack);
      }
      _addck(image_res[1]);

      try{
        var json = {'code':''};
        var string = JSON.stringify(json);
        yield writeFile('./captcha.json',string);
        var captcha_path = './'+username+'_captcha_code.jpg';
        var res = yield writeFile(captcha_path,image_res[0]);  
      }catch(err){
        debug(err.stack);
      }
      debug('验证码地址:',captcha_path);
      debug('请将图片中的验证码输入到此文件：captcha_code.json');
      
      //获取验证码的cookie里面
      _set_verifysession();
      ///====================获取验证码
      _verifycode = yield set_captcha_code();
    }

    _p = Encryption.getEncryption(password,_salt,_verifycode,false);

  }catch(err){
    debug('ptui_checkVC Error:',err.stack);
    return false;
  }

  /**
   * 登录提交 
   */
  var login_url = 'https://ssl.ptlogin2.qq.com/login';
  var login_data = {
    'u':username,
    'verifycode':_verifycode,
    'pt_vcode_v1':0,
    'pt_verifysession_v1':_pt_verifysession_v1,
    'p':_p,
    'pt_randsalt':0,
    'u1':'https://mail.qq.com/cgi-bin/login?vt=passport&vm=wpt&ft=loginpage&target=&account='+username,
    'ptredirect':1,
    'h':1,
    't':1,
    'g':1,
    'from_ui':1,
    'ptlang':'2052',
    'action':'2-3-1432202218068',
    'js_ver':10123,
    'js_type':1,
    'login_sig':_pt_login_sig,
    'pt_uistyle':25,
    'aid':'522005705',
    'daid':4
  };

  login_url = [login_url,queryString.encode(login_data)].join('?');

  try{
    var res = yield request(login_url,{
      method:'GET',
      headers:{
        'Cookie':_ckstr(),
        'Referer':ptlogin_url,
        'Host':'ssl.ptlogin2.qq.com',
        'User-Agent':_user_agent
      }
    });
    _addck(res[1]);
    //执行返回的结果 获取成功登录的跳转地址
    eval(res[0].toString());
  }catch(err){
    debug('登录提交 Error:',err.stack);
    return false;
  }

  /**
   * 验证check_sig并获取跳转地址
   */
  if(!redirect_url){
    throw new Error('登录失败');
  }

  try{
    var res = yield request(redirect_url,{
      method:'GET',
      headers:{
        'Cookie':_ckstr(),
        'Referer':ptlogin_url,
        'Host':'ssl.ptlogin2.qq.com',
        'User-Agent':_user_agent
      }
    });

    debug(res);
    _addck(res[1]);
    var location_url = '';

    if(res['1']['status'] == 302){
      location_url = res[1]['headers']['location'];
    }
  }catch(err){
    debug('验证check_sig Error:',err.stack);
    return false;
  }

  
  //做302 跳转请求 - 
  if(location_url){
    try{
      var redirect_res = yield request(location_url,{
        method:"GET",
        headers:{
          'Cookie':_ckstr(),
          'Referer':redirect_url,
          'Host':'mail.qq.com',
          'User-Agent':_user_agent
        }
      });
      _addck(redirect_res[1]);

      var javascript = redirect_res[0].toString().replace(/ +/g, ' ').replace(/\r\n/g,' ').replace(/\n/g,' ').match(/<script>(.+?)<\/script>/g);
      var urlHead_res = javascript[1].replace(/<script>(.+?)<\/script>/g,'$1');
      var targetUrl = '';
      var urlHead_arr = urlHead_res.split('; ');
      var urlHead = urlHead_arr[0].match(/urlHead="(.*?)"/g,'$1');
      urlHead = urlHead[0].replace(/urlHead="(.*?)"/g,'$1');
      eval(urlHead_arr[4]);
      var r = javascript[1].match(/targetUrl\+="(.*?)";/g,'$1');
      r = r[0].replace(/targetUrl\+="(.*?)";/g,'$1');
      targetUrl = targetUrl+r;
      var tmp_targetUrl = targetUrl.split('?');
      if(tmp_targetUrl[1]){
        var tmp_targetUrl_arr = queryString.decode(tmp_targetUrl[1]);
        if(tmp_targetUrl_arr['sid']){
          var tmp_arr = [];
          tmp_arr.push('Location_sid='+tmp_targetUrl_arr['sid']);
          __cookies = __cookies.concat(tmp_arr);
        }
      }
    }catch(err){
      debug(err.stack);
      return false;
    }

    if(targetUrl){
      try{
        var target_res = yield request(targetUrl,{
          method:'GET',
          headers:{
            'Cookie':_ckstr(),
            'Host':'mail.qq.com',
            'User-Agent':_user_agent
          }
        });
        _addck(target_res[1]);

      }catch(err){
        debug(err.stack);
        return false;
      }
    }else{
      debug(new Error('目标地址不存在'));
      return false;
    }
    
  }else{
    debug(new Error('302跳转地址不存在'));
    return false;
  }
  
  return _ckstr();
}

module.exports = {
  getCookie:co.wrap(doLogin),
  test: function (str) {
    return /.*@qq\.com?$/.test(str);
  }
};