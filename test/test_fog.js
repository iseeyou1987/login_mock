'use strict';

var fog = require('../lib/fog');
var should = require('should');
var debug = require('debug')('fog');


describe('Test Fog',function(){
  it('fog encode and decode',function*(){
    var password_str = '123456';
    var encode_str = fog.encode(password_str);
    debug(encode_str);
    var decode_str = fog.decode(encode_str);
    debug(decode_str);
    decode_str.should.equal(password_str)
  });
});