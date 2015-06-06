'use strict';

var co = require('co');
var fs = require('fs');
var eventWrap = require('co-event-wrap');
var should = require('should');
var ImportEmail = require('../tasks/importEmail');
var debug = require('debug')('test_import_email');

describe('Import Email Test',function(){
  it('126 login and fetcher email',function *(){
    try{
      var res = yield ImportEmail(49792);
    }catch(e){
      debug(e.stack);
    }
    
  });
});