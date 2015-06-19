'use strict';

var co = require('co');
var net = require('../mockers/126');
var fs = require('fs');
var thunkify = require('thunkify');
var writeFile = thunkify(fs.writeFile);

var username = 'zzzz@126.com';
var password = 'zzzz';

describe('126 login',function(){
  it('get cookie',function *(){
    try{
      var cookie = yield net.getCookie(username,password);
      debug('cookie:',cookie);
      yield writeFile(__dirname+'/cookie.txt',cookie);
    }catch(e){
      debug(e.stack);
    }
  });
});