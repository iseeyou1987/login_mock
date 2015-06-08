/**
 * Created by zhaolei on 12/16/14.
 */
"use strict";
//XXX 注意可能的循环引用
var mysql = require("mysql");
var async = require("async");
var _ = require("lodash");
var config = require("../config");
var logger = require("./log").getLogger('mysql');

module.exports.escape = mysql.escape;

var pool = mysql.createPool({
  connectionLimit: config.mysql.poolSize,
  host: config.mysql.hostname,
  user: config.mysql.username,
  password: config.mysql.password
});
pool.on('error', function(err) {
  logger.error(err);
});

module.exports.strictQuery = function(sql, values, cb) {
  sql = _.trim(sql).replace(/ +/g, ' ');
  logger.info('/*NO-CACHE*/', sql);

  pool.query(sql, values, cb);
};

module.exports.query = function(sql, values, cb) {
  sql = _.trim(sql).replace(/ +/g, ' ');
  logger.info('/*NO-CACHE*/', sql);

  pool.query(sql, values, cb);
};