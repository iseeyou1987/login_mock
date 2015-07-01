'use strict';

/**
 * gmail邮箱登录
 */
var co = require('co');
var thunkify = require('thunkify');
var urllib = require('urllib');
var request = thunkify(urllib.request);
var fs = require('fs');
var xml = require('xml');
var _ = require('lodash');
var cookie = require('cookie');
var xml2js = require('xml2js');
var parseString = thunkify(xml2js.parseString);

function *doLogin(username,password){

  return true;
}

module.exports = {
  getCookie:co.wrap(doLogin),
  test: function (str) {
  return /.*@gmail\.com?$/.test(str);
  }
};