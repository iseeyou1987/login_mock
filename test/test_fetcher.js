'use strict';

var Fetcher = require('../lib/mail_fetcher/126');
var co = require('co');
var fs = require('fs');
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);

describe('Fetcher',function(){
  it('test list',function *(){
    var cookie = yield readFile(__dirname+'/126_cookie.txt');
    // console.log(cookie);
    var fetcher = new Fetcher({'cookie':cookie});
    var res = yield fetcher.getList();
    console.log(res);
  });
});