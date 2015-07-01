/**
 * Created by zhaolei on 12/17/14.
 */

"use strict";

var mysql = require("./mysql");
var util = require("./utils");
var _ = require("lodash");
var moment = require('moment');
var pass = require("./password");
var hash = require('./hash');

var _hash = function (token) {
  return hash.fnv(token);
};

module.exports.getClient = function (clientId, clientSecret, callback) {
  var sql = 'SELECT client_id, client_secret, redirect_uri FROM qeeniao.oauth_clients ' +
    'WHERE client_id=' + mysql.escape(clientId);
  mysql.query(sql, function (err, res) {
    if (err || _.isEmpty(res)) {
      return callback(err || new Error("getClient error[No client token find]."));
    }
    var client = res[0];
    if (clientSecret !== null && client.client_secret !== clientSecret) {
      return callback(new Error("Wrong client secret."));
    }

    // This object will be exposed in req.oauth.client
    callback(null, {
      clientId: client.client_id,
      clientSecret: client.client_secret
    });

  });
};

module.exports.grantTypeAllowed = function (clientId, grantType, callback) {
  callback(false, true);
};

module.exports.getAccessToken = function (bearerToken, callback) {
  if (!bearerToken || !bearerToken.length) {
    return callback(new Error(" The access_token is not available. --" + bearerToken));
  }
  var sql = 'SELECT access_token, client_id, expires, user_id ' +
    'FROM qeeniao.oauth_access_tokens WHERE access_token=${atk} AND token_hash=${hs}';
  sql = _.template(sql)({
    atk: mysql.escape(bearerToken),
    hs: _hash(bearerToken)
  });
  mysql.query(sql, function (err, res) {
    if (err || _.isEmpty(res)) {
      return callback(err);
    }
    var token = res[0];
    callback(null, {
      accessToken: token.access_token,
      clientId: token.client_id,
      userId: token.user_id,
      expires: token.expires
    });
  });
};

module.exports.saveAccessToken = function (accessToken, clientId, expires, user, callback) {
  var uid = _.isObject(user) ? user.id : user;
  var _ft = function (t) {
    return '\'' + moment(t).format('YYYY-MM-DD HH:mm:ss') + '\'';
  };
  var sql = 'INSERT INTO qeeniao.oauth_access_tokens (access_token,client_id,user_id,expires,create_time,token_hash) ' +
    'VALUES (${atk}, ${cid}, ${uid}, ${exp}, ${ct}, ${th})';
  sql = _.template(sql)({
    atk: mysql.escape(accessToken),
    cid: mysql.escape(clientId),
    uid: uid,
    exp: _ft(expires),
    ct: _ft(new Date()),
    th: _hash(accessToken)
  });
  mysql.query(sql, function (err, res) {
    callback(err);
  });
};

module.exports.getRefreshToken = function (bearerToken, callback) {
  var sql = 'SELECT refresh_token refreshToken, client_id clientId, expires, user_id userId ' +
    'FROM qeeniao.oauth_refresh_tokens WHERE refresh_token=${rtk} AND token_hash=${th}';
  sql = _.template(sql)({
    rtk: mysql.escape(bearerToken),
    th: _hash(bearerToken)
  });
  mysql.query(sql, function (err, res) {
    if (err || _.isEmpty(res)) {
      return callback(err || new Error("getRefreshToken error[No client token find]."));
    }
    res = res[0];
    callback(null, {
      refreshToken: res.refreshToken,
      clientId: res.clientId + "",
      expires: res.expires,
      userId: res.userId
    });
  });
};

module.exports.saveRefreshToken = function (refreshToken, clientId, expires, user, callback) {
  var uid = _.isObject(user) ? user.id : user;
  var _ft = function (t) {
    return '\'' + moment(t).format('YYYY-MM-DD HH:mm:ss') + '\'';
  };
  var sql = 'INSERT INTO qeeniao.oauth_refresh_tokens (refresh_token,client_id,user_id,expires,create_time,token_hash)'+
    ' VALUES (${rtk}, ${cid}, ${uid}, ${exp}, ${ct}, ${th})';
  sql = _.template(sql)({
    rtk: mysql.escape(refreshToken),
    cid: mysql.escape(clientId),
    uid: uid,
    exp: _ft(expires),
    ct: _ft(new Date()),
    th: _hash(refreshToken)
  });
  mysql.query(sql, function (err, res) {
    callback(err);
  });
};

module.exports.getUser = function (username, password, callback) {
  var sql = 'SELECT user_id as id, password, email FROM qeeniao.user WHERE username=${uname} OR email=${uname}';
  sql = _.template(sql)({uname: mysql.escape(username)});
  mysql.query(sql, function (err, res) {
    if (err) {
      return callback(err);
    }
    if (_.isEmpty(res)) {
      return callback(new Error("User not found."));
    }
    var user = res[0];
    if (user.password != pass(user.email, password)) {
      return callback(new Error("Wrong password."));
    }
    return callback(null, user.id);
  });
};

