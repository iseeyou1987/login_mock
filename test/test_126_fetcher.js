'use strict';

var Fetcher = require('../lib/mail_fetcher/126');
var co = require('co');
var fs = require('fs');
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);
var eventWrap = require('co-event-wrap');
var should = require('should');
var net126 = require('../mockers/126');

var username = '';
var password = '';

describe('126 Fetcher',function(){
  it('test list',function *(){
    try{
      var cookie = yield net126.getCookie(username,password);
    }catch(e){
      console.log('Get Cookie Error:',e);
    }
    
    var fetcher = new Fetcher({'cookie':cookie});
    var ev = eventWrap(fetcher);
    ev.on('message', function* (data) {
      data.should.have.property('subject');
      data.should.have.property('content');
      data.should.have.property('date');
      
      console.log('data:',data);
    });

    ev.on('error', function* (data) {
      console.log('Error:',data);
    });

    ev.on('end', function* (data){
      console.log('End:',data);
    });

    var res = yield fetcher.getContent();
  });
});