'use strict';
/**
 * 163 邮箱登录 mail.163.com
 * @type {[type]}
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

  var entry_url = "https://mail.163.com/entry/cgi/ntesdoor?df=mail163_letter&from=web&funcid=loginone&iframe=1&language=-1&passtype=1&product=mail163&net=t&style=-1&race=34_32_42_bj&uid="+username+"&hid=10010102";
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
  var mail_url = match_res[0].replace(/top.location.href = "(.*?)"/g,'$1');
  var headers = res[1].headers;
  _addck(res[1]);

  var res = yield request(mail_url,{
    method:'GET',
    headers:{
      'Host': 'mail.163.com',
      'Cookie': _ckstr(),
      'User-Agent': _user_agent
    }
  });

  //邮箱主页html--获取sid
  var index_html = res[0].toString();
  _addck(res[1]);

  try{
    //获取sid
    var match_res = index_html.match(/<script type="text\/javascript">(.*?)<\/script>/g);
    var math_res_1 = match_res[1].match(/sid:'(.*?)'/g);
    var sid = math_res_1[0].replace(/sid:'(.*?)'/g,'$1');
  }catch(error){
    console.error(error.stack);
    return false;
  }

  //收件箱--列表
  var mail_url = 'http://mail.163.com/js6/s?sid='+sid+'&func=mbox:listMessages&TopTabReaderShow=1&TopTabLofterShow=1&welcome_welcomemodule_mailrecom_click=1&LeftNavfolder1Click=1&mbox_folder_enter=1';

  try{
    //请求参数
    var root = xml([{'object':[
      {'int':[{_attr:{'name':'fid'}},1]},
      {'string':[{_attr:{'name':'order'}},'date']},
      {'boolean':[{_attr:{'name':'desc'}},true]},
      {'int':[{_attr:{'name':'limit'}},20]},
      {'int':[{_attr:{'name':'start'}},0]},
      {'boolean':[{_attr:{'name':'skipLockedFolders'}},false]},
      {'string':[{_attr:{'name':'topFlag'}},'top']},
      {'boolean':[{_attr:{'name':'returnTag'}},true]},
      {'boolean':[{_attr:{'name':'returnTotal'}},true]}
      ]}],{declaration: true});
  }catch(err){
    console.error(err.stack);
    return false;
  }

  var search_data = {
    'var':root
  };
  try{
    res = yield request(mail_url,{
      method:'POST',
      data:search_data,
      headers:{
        'Host':'mail.163.com',
        'Origin':'http://mail.163.com',
        'Referer':'http://mail.163.com/js6/main.jsp?sid='+sid+'&df=mail163_letter',
        'Cookie': _ckstr(),
        'User-Agent': _user_agent
      }
    });
    var list = res[0].toString();
  }catch(err){
    console.log(err);
  }

  try{
    var result = yield parseString(list);
    //邮件ID
    var mid = result['result']['array'][0]['object'][0]['string'][0]['_']; 
  }catch(err){
    console.log(err);
    return false;
  }


  //获取邮件内容
  //<?xml version="1.0"?>
  //<object>
  //  <string name="id">88:1tbiWBkAcE3AaNRAWgAAsa</string>
  //  <boolean name="header">true</boolean>
  //  <boolean name="returnImageInfo">true</boolean>
  //  <boolean name="returnAntispamInfo">true</boolean>
  //  <boolean name="autoName">true</boolean>
  //  <object name="returnHeaders">
  //    <string name="Resent-From">A</string>
  //    <string name="Sender">A</string>
  //    <string name="List-Unsubscribe">A</string>
  //    <string name="Reply-To">A</string>
  //  </object>
  //  <boolean name="supportTNEF">true</boolean>
  //</object>
  var data = xml({'object':[
      {'string':[{_attr:{'name':'id'}},mid]},
      {'boolean':[{_attr:{'name':'header'}},true]},
      {'boolean':[{_attr:{'name':'returnImageInfo'}},true]},
      {'boolean':[{_attr:{'name':'returnAntispamInfo'}},true]},
      {'boolean':[{_attr:{'name':'autoName'}},true]},
      {'object':[
          {_attr:{'name':'returnHeaders'}},
          {'string':[{_attr:{'name':'Resent-From'}},'A']},
          {'string':[{_attr:{'name':'Sender'}},'A']},
          {'string':[{_attr:{'name':'List-Unsubscribe'}},'A']},
          {'string':[{_attr:{'name':'Reply-To'}},'A']}
        ]},
      {'boolean':[{_attr:{'name':'supportTNEF'}},true]},
    ]
  },{declaration: true});

  var headers_url = 'http://mail.163.com/js6/s?sid='+sid+'&func=mbox:readMessage&l=read&action=read';
  var html_url = 'http://mail.163.com/js6/read/readhtml.jsp?mid='+mid+'&font=15&color=1D6CA3';
  var detail_data = {
    'var':data
  }
  var headers_res = yield request(headers_url,{
    method:'POST',
    data:detail_data,
    headers:{
      'Host':'mail.163.com',
      'Cookie': _ckstr(),
      'Referer':'http://mail.163.com/js6/main.jsp?sid='+sid+'&df=wm_switch',
      'User-Agent':_user_agent
    }
  });
  var header_object = yield parseString(headers_res[0].toString());
  var from = header_object['result']['object'][0]['array'][0]['string'];
  var to = header_object['result']['object'][0]['array'][1]['string'];
  var mail_result = {};
  mail_result['from'] = from;
  mail_result['to'] = to;

  var html_res = yield request(html_url,{
    method:'GET',
    headers:{
      'Host':'mail.163.com',
      'Cookie': _ckstr(),
      'Referer':'http://mail.163.com/js6/main.jsp?sid='+sid+'&df=wm_switch',
      'User-Agent':_user_agent
    }
  });

  mail_result['html'] = html_res[0].toString();
  
  return mail_result;
}

module.exports = {
  getCookie:co.wrap(doLogin)
}

// var username = 'xxxxxxxxx';
// var password = 'xxxxxxxxxx';

// var write = thunkify(fs.writeFile);
// co.wrap(doLogin)(username,password).then(function(val){
//   console.log(val);
// });

