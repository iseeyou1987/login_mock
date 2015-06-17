'use strict';

var Fetcher = require('../lib/mail_fetcher/sina').Fetcher;
var co = require('co');
var fs = require('fs');
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);
var eventWrap = require('co-event-wrap');
var should = require('should');
var netsina = require('../mockers/sina');
var moment = require('moment');
var debug = require('debug')('sina_fetcher');

var username = 'zzzz@sina.cn';
var password = 'zzzz';

describe('sina Fetcher',function(){
  it('test list',function *(){
    try{
      var cookie = yield netsina.getCookie(username,password);
    }catch(e){
      console.log('message:',e.message);
      debug(e.stack);
      return;
    }

    var fetcher = new Fetcher({'cookie':cookie,'date':moment('2015-03-26').toDate()});
    var ev = eventWrap(fetcher);

    ev.on('message', function* (data) {
      data.should.have.property('subject');
      data.should.have.property('content');
      data.should.have.property('date');
    });

    ev.on('error', function* (error) {
      console.log('Error:',error.stack);
    });

    ev.on('end', function* (data){
      console.log('End:',data);
    });

    var res = yield fetcher.getContent();
  });
});