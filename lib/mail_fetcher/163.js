'use strict';
/**
 * 126邮箱账单获取
 */
var co = require('co');
var urllib = require('urllib');
var thunkify = require('thunkify');
var request = thunkify(urllib.request);
var querystring = require('querystring');
var XML = require('xml');
var Xml2json = require('xml2json');
var _ = require('lodash');

var Fetcher = function(options){
  this.cookie = options.cookie || '';
  this.user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.76 Safari/537.36';


}

Fetcher.prototype.getList = function *(){
  
}