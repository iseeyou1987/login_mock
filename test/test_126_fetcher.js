'use strict';

var Fetcher = require('../lib/mail_fetcher/126');
var co = require('co');
var fs = require('fs');
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);
var eventWrap = require('co-event-wrap');
var EventEmitter = require('events').EventEmitter;
var should = require('should');


describe('126 Fetcher',function(){
  it('test list',function *(){
    var cookie = yield readFile(__dirname+'/126_cookie.txt');

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