'use strict';

var Fetcher = require('../lib/mail_fetcher/sohu').Fetcher;
var co = require('co');
var fs = require('fs');
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);
var writeFile = thunkify(fs.writeFile);
var eventWrap = require('co-event-wrap');
var should = require('should');
var net = require('../mockers/sohu');
var moment = require('moment');
var debug = require('debug')('test_sohu_fetcher');
var _ = require('lodash');

var username = 'zzzz@sohu.com';
var password = 'zzzz';

describe('sohu Fetcher',function(){
  it('test list',function *(){
    try{
      var cookie = yield net.getCookie(username,password);
    }catch(e){
      debug('Get Cookie Error:',e);
    }

    var fetcher = new Fetcher({'cookie':cookie,'date':moment('2015-05-10').toDate()});
    var ev = eventWrap(fetcher);
    var i = 0;
    ev.on('message', function* (data) {
      data.should.have.property('subject');
      data.should.have.property('content');
      data.should.have.property('date');
      i++;
      yield writeFile(__dirname + '/data/content_'+i+'_result.txt',data['content']);
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