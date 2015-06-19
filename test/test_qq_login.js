'use strict';

var co = require('co');
var net = require('../mockers/qq');
var fs = require('fs');
var thunkify = require('thunkify');
var writeFile = thunkify(fs.writeFile);
var debug = require('debug')('test_qq_login');

var username = 'zzzz@qq.com';
var password = 'zzzz';

describe('qq login',function(){
  it('get cookie',function *(){
    try{
      var cookie = yield net.getCookie(username,password);
      debug('cookie:',cookie);
      yield writeFile(__dirname+'/cookie.txt',cookie);
    }catch(e){
      debug('error:',e.stack);
    }
  });
});