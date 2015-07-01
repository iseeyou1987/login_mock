'use strict';

var _ = require('lodash');
var moment = require('moment');
var passwd = require('../password');
var mysql = require('../mysql');
var Queue = require("../task_queue");
var Fog = require('../fog');
var os = require('os');

/**
 * 获取email_import 表 user的信息
 * @param {[type]} uid           [description]
 * @yield {[type]} [description]
 */
module.exports.emailImportInfo = function *(uid){
  return new Promise(function(resolve,reject){
    var sql = 'SELECT * FROM qeeniao.email_import_info WHERE user_id = ${user_id}';
    sql = _.template(sql)({
      'user_id':uid
    });
    console.log(sql);
    mysql.strictQuery(sql,function(err,result){
      if(err) return reject(err);
      return resolve(result);
    });
  });
}

/**
 * 添加数据
 * @param {[type]} records [description]
 */
module.exports.addEmailImport = function(records){
  return new Promise(function(resolve,reject){
    var sql = sqlBuilder.makeInsertSql('qeeniao.email_import_info', records);
    mysql.strictQuery(sql, function (err, result) {
      if(err) return reject(err);
      return resolve(result);
    });
  });
}

/**
 * 更新数据
 * @param  {[type]} email       [description]
 * @param  {[type]} pass        [description]
 * @param  {[type]} last_import [description]
 * @param  {[type]} uid         [description]
 * @return {[type]}             [description]
 */
module.exports.updateEmailImport = function(email,pass,last_import,uid){
  return new Promise(function(resolve,reject){
    var sql = 'UPDATE qeeniao.email_import_info SET last_import="${last_import}", email="${email}",password="${password}" WHERE user_id=${user_id}';
    sql = _.template(sql)({
      "email": email,
      "password":Fog.encode(pass),
      "user_id": uid,
      "last_import":last_import
    });
    mysql.strictQuery(sql, function (err, result) {
      if(err) return reject(err);
      return resolve(result);
    });
  });
}

/**
 * 队列添加任务
 * @param {[type]} uid [description]
 */
module.exports.addQueue = function(uid){
  return new Promise(function(resolve,reject){
    var q = new Queue({
      app: {
        escape: mysql.escape,
        query: mysql.strictQuery
      }
    });
    q.add({
      type: "mockImportMail",
      owner: "qeeniao-api@" + os.hostname(),
      info: JSON.stringify({uid:uid})
    }, function(e, r) {
      if(e) return reject(e);
      return resolve(r);
    });
  });
}