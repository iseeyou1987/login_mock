'use strict';
var co = require('co');
var net = require('../mockers/yeah');
var fs = require('fs');
var thunkify = require('thunkify');
var writeFile = thunkify(fs.writeFile);
var debug = require('debug')('test_yeah_login');

var username = 'zzzz@yeah.net';
var password = 'zzzz';

describe('yeah login',function(){
  it('get cookie',function *(){
    try{
      var cookie = yield net.getCookie(username,password);
      debug(cookie);
    }catch(e){
      debug(e.stack);
    }
  });
});