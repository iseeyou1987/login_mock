'use strict';

var co = require('co');
var net126 = require('../mockers/126');
var username = 'xxxxxxxxxxxxx@126.com';
var password = 'xxxxx';
var fs = require('fs');
var thunkify = require('thunkify');
var writeFile = thunkify(fs.writeFile);

describe('126 login',function(){
  it('get cookie',function *(){

    try{
      var cookie = yield net126.getCookie(username,password);
      yield writeFile(__dirname+'/126_cookie.txt',cookie);
    }catch(e){
      console.log(e.message);
    }
  });
});