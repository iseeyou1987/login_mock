'use strict';
var co = require('co');
var net139 = require('../mockers/139');
var fs = require('fs');
var thunkify = require('thunkify');
var writeFile = thunkify(fs.writeFile);
var debug = require('debug')('139_login');

var username = 'xxxxxxxxx@139.com';
var password = 'zzzzzzzzzzzz';

describe('139 login',function(){
  it('get cookie',function *(){
    try{
      var cookie = yield net139.getCookie(username,password);
      console.log(cookie);
    }catch(e){
      debug(e.stack);
    }
  });
});