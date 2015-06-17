
var co = require('co');
var sina = require('../mockers/sina.js');
var debug = require('debug')('sina_login');
var fs = require('fs');
var thunkify = require('thunkify');
var writeFile = thunkify(fs.writeFile);

var username = 'z@sina.com';
var password = 'qeeniao!QA';

describe('sina login ',function(){
  it('should get cookie',function *(){
    try{
      var cookie = yield sina.getCookie(username,password);
      yield writeFile(__dirname+'/sina_cookie.txt',cookie);
      debug('cookie:',cookie);
    }catch(error){
      debug(error.stack);
    }
  });
});
