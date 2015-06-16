'use strict';
var co = require('co');
var net139 = require('../mockers/139');
var username = 'xxxxxxxxx@139.com';
var password = 'zzzzzzzzzzzz';
var fs = require('fs');
var thunkify = require('thunkify');
var writeFile = thunkify(fs.writeFile);

describe('139 login',function(){
  it('get cookie',function *(){
    try{
      var cookie = yield net139.getCookie(username,password);
      yield writeFile(__dirname+'/139_cookie.txt',cookie);
      console.log(cookie);
    }catch(e){
      console.log(e.message);
    }
  });
});