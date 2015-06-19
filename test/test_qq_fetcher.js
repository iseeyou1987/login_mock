'use strict';

var Fetcher = require('../lib/mail_fetcher/qq').Fetcher;
var co = require('co');
var fs = require('fs');
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);
var eventWrap = require('co-event-wrap');
var should = require('should');
var net = require('../mockers/qq');
var moment = require('moment');
var debug = require('debug')('qq_fetcher');

var username = 'zzzz@qq.com';
var password = 'zzzz';

describe('qq Fetcher',function(){
  it('test list',function *(){
    try{
      var cookie = yield net.getCookie(username,password);
    }catch(e){
      debug('Get Cookie Error:',e);
    }

    var fetcher = new Fetcher({'cookie':cookie,'date':moment('2014-09-10').toDate()});
    var ev = eventWrap(fetcher);
    ev.on('message', function* (data) {
      data.should.have.property('subject');
      data.should.have.property('content');
      data.should.have.property('date');
    });

    ev.on('error', function* (error) {
      debug('Error:',error.stack);
    });

    ev.on('end', function* (data){
      debug('End:',data);
    });

    var res = yield fetcher.getContent();
  });
});