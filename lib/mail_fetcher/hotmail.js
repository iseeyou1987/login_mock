'use strict';
/**
 * hotmail邮箱账单获取
 */
var co = require('co');
var urllib = require('urllib');
var thunkify = require('thunkify');
var request = thunkify(urllib.request);
var querystring = require('querystring');
var cookieParser = require('cookie-js');
var XML = require('xml');
var Xml2json = require('xml2json');
var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('163_fetcher');
var moment = require('moment');


var Fetcher = function(options){
  this.sid = '';
  this.mail_url = '';
  this.cookie = options.cookie || '';
  this.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36';
  this.date = options.date;
};

util.inherits(Fetcher, EventEmitter);

module.exports = {
  'Fetcher':Fetcher,
  'test':function(str){
    return /.*@hotmail\.com?$/.test(str);
  }
};