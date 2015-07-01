/**
 * Created by zhaolei on 1/29/15.
 * utils
 */

"use strict";

var _ = require("lodash");
var os = require("os");
var crypto = require('crypto');

module.exports.oauthUid = function (req) {
  if (!req.oauth || !req.oauth.bearerToken) {
    return false;
  }
  var uid = req.oauth.bearerToken.userId;
  return uid;
};

/**
 * 验证 sync 条目格式
 * @param row
 * @returns {boolean | Error}
 */
module.exports.syncDataValidate = function (row) {
  var e = false;
  if (!_.contains(["insert", "update", "delete"], row.action)) {
    e = new Error("Action '" + row.action + "' is not accept.");
  }
  if (_.isEmpty(row.content)) {
    e = new Error("Has empty content. The server not accept.");
  }
  return e;
};

var ip = module.exports.ip = function () {
  var ip = "127.0.0.1";
  var data = os.networkInterfaces();
  _.forEach(["en0", "eth0"], function (k) {
    if (!data[k]) {
      return;
    }
    ip = _.result(_.find(data[k], function (one) {
      return one.family === "IPv4";
    }), "address");
  });
  return ip;
};

module.exports.ip2long = function (ipStr) {
  if (!ipStr) {
    ipStr = ip();
  }
  return _.reduce(ipStr.split(".").reverse(), function (sum, v, i) {
    return sum + v * Math.pow(256, i);
  });
};

module.exports.md5 = function(str) {
  var md5 = crypto.createHash("md5");
  md5.update(str);
  return md5.digest("hex");
};

// keys: ['method', 'content.uuid']
module.exports.distinct = function(objArr, keys) {
  var tmp = {};
  var _key = function(obj, keys) {
    var strs = [];
    _.forEach(keys, function(k) {
      var stack = k.split('.');
      var val = obj;
      while(stack.length > 0) {
        val = val[stack.shift()];
      }
      strs.push(val);
    });
    return strs.join('_');
  };
  _.forEach(objArr, function(obj) {
    tmp[_key(obj, keys)] = obj;
  });
  return _.values(tmp);
};