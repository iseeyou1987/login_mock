'use strict';

var co = require('co');
var net = require('../mockers/sohu');
var fs = require('fs');
var thunkify = require('thunkify');
var writeFile = thunkify(fs.writeFile);
var debug = require('debug')('test_sohu_login');

var username = 'zzzz@sohu.com';
var password = 'zzzz';

describe('sohu login',function(){
  it('get cookie',function *(){
    try{
      var cookie = yield net.getCookie(username,password);
      debug(cookie);
    }catch(e){
      debug(e.stack);
    }
  });
});