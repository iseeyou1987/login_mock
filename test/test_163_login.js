'use strict';
var co = require('co');
var net = require('../mockers/163');
var fs = require('fs');
var thunkify = require('thunkify');
var writeFile = thunkify(fs.writeFile);
var debug = require('debug')('163_login');

var username = 'zzzz@163.com';
var password = 'zzzz';

describe('163 login',function(){
  it('get cookie',function *(){
    try{
      var cookie = yield net.getCookie(username,password);
      debug(cookie);
    }catch(e){
      debug(e.stack);
    }
  });
});