"use strict";

var mysql = require("../mysql");
var util = require("util");
var _ = require("lodash");
var pass = require("../password");
var async = require("async");
var moment = require("moment");

var FIELDS = [
  'user_id',
  'is_admin',
  'username',
  'email',
  'password',
  'mobilephone',
  'gender',
  'openid',
  'headimg',
  'signature',
  'nick',
  'referrer',
  'device_key',
  'ctime',
  'last_login',
  'last_ip',
  'is_deleted',
  'bg_img',
  'bg_img_custom',
  'budget_sum',
  'color'
];
var FIELDS_STRING = FIELDS.join(',');

module.exports.getAdmins = function (cb) {
  var sql = 'SELECT ' + FIELDS_STRING + ' FROM qeeniao.user WHERE is_admin=1';
  mysql.query(sql, function (err, res) {
    cb(err, res);
  });
};

module.exports.getUser = function (userInfo, cb) {
  var sql = 'SELECT ' + FIELDS_STRING + ' FROM qeeniao.user WHERE %s';
  var conditions = [];
  _.forEach(userInfo, function (v, k) {
    if (!_.contains(FIELDS, k)) {
      return;
    }
    conditions.push(k + '=' + mysql.escape(v));
  });
  if (_.isEmpty(conditions)) {
    return cb(new Error('no conditions.'));
  }
  mysql.query(util.format(sql, conditions.join(' AND ')), function (err, res) {
    cb(err, res);
  });
};

module.exports.getLoginUser = function(userInfo, cb) {
  var sql = 'SELECT ' + FIELDS_STRING + ' FROM qeeniao.user WHERE email=%s OR username=%s';
  mysql.query(
    util.format(sql,
      mysql.escape(userInfo.email),
      mysql.escape(userInfo.username)),
    function(err, res) {
    cb(err, res);
  });
};

module.exports.addUser = function (userInfo, cb) {
  // 必填字段验证
  var fieldCheckPass = true;
  _.forEach(['username', 'password', 'email'], function (key) {
    if (!_.has(userInfo, key)) {
      fieldCheckPass = false;
    }
  });
  if (!fieldCheckPass) {
    return cb(new Error('Field check Fail. Need these fields [username,password,email] at least.'));
  }

  // encode password
  userInfo.password = pass(userInfo.email, userInfo.password);
  // add create time
  userInfo.ctime = moment().unix();

  // for iOS
  // 更换accesskey后第三方用户的自动迁移
  if (userInfo.device_key && userInfo.nick) {
    findExist(function(err, res) {
      if (err) {
        return cb(err);
      }
      if (!_.isEmpty(res)) {
        var uid = _.first(res).user_id;
        updateExist(uid, cb);
      } else {
        normalInsert(cb);
      }
    });
  } else {
    normalInsert(cb);
  }

  function findExist(callback) {
    var sql = 'SELECT user_id FROM qeeniao.user WHERE device_key=${d} AND nick=${n}';
    sql = _.template(sql)({
      d: mysql.escape(userInfo.device_key),
      n: mysql.escape(userInfo.nick)
    });
    mysql.query(sql, function(err, res) {
      callback(err, res);
    });
  }

  function updateExist(uid, callback) {
    var sql = 'UPDATE qeeniao.user SET username=${name},password=${pass},email=${email} WHERE user_id=${uid}';
    sql = _.template(sql)({
      name: mysql.escape(userInfo.username),
      pass: mysql.escape(userInfo.password),
      email: mysql.escape(userInfo.email),
      uid: +uid
    });
    mysql.query(sql, function(err, res) {
      callback(err, res);
    });
  }

  function normalInsert(callback) {
    // 拼装 sql
    var keys = [];
    var vals = [];
    _.forEach(userInfo, function(v, k) {
      if (_.contains(FIELDS, k)) {
        keys.push(k);
        vals.push(mysql.escape(v));
      }
    });
    var sql = util.format(
      'INSERT INTO qeeniao.user (%s) VALUES (%s)',
      keys.join(','),
      vals.join(',')
    );
    mysql.query(sql, function(err, res) {
      callback(err, res);
    });
  }
};

module.exports.updateUserInfo = function (userInfo, cb) {
  if (!_.has(userInfo, 'user_id')) {
    return cb(new Error('user_id required when update.'));
  }

  // 拼装 sql
  var sets = [];
  _.forEach(userInfo, function (v, k) {
    if (_.contains(FIELDS, k)) {
      // pk 不能更改
      if ('user_id' === k) {
        return;
      }
      sets.push(k + '=' + mysql.escape(v));
    }
  });
  if (_.isEmpty(sets)) {
    return cb(new Error('node field changed when update.'));
  }
  var sql = util.format(
    'UPDATE qeeniao.user SET %s WHERE user_id=%d',
    sets.join(','),
    userInfo.user_id
  );

  mysql.query(sql, function (err, res) {
    cb(err, res);
  });
};

module.exports.cleanAllData = function (userInfo, cb, del) {
  var uid = userInfo.user_id;
  if (_.isUndefined(uid) || uid < 1) {
    return cb();
  }
  var sqls;
  if (!del) {
    sqls = [
      "UPDATE qeeniao.user SET bg_img=10,budget_sum=0,color='',bg_img_custom='' WHERE user_id=${uid}",
      "UPDATE qeeniao.record SET is_deleted=1 WHERE user_id=${uid}",
      "UPDATE qeeniao.record_type SET is_deleted=1 WHERE user_id=${uid}",
      "UPDATE qeeniao.account SET is_deleted=1 WHERE user_id=${uid}",
      "UPDATE qeeniao.account_type SET is_deleted=1 WHERE user_id=${uid}",
    ];
  } else {
     sqls = [
      "UPDATE qeeniao.user SET bg_img=10,budget_sum=0,color='',bg_img_custom='' WHERE user_id=${uid}",
      "UPDATE qeeniao.record SET is_deleted=1 WHERE user_id=${uid}",
      "DELETE FROM qeeniao.record_type WHERE user_id=${uid}",
      "DELETE FROM qeeniao.account WHERE user_id=${uid}",
      "DELETE FROM qeeniao.account_type WHERE user_id=${uid}"
    ];
  }


  var query = function (sql, callback) {
    mysql.query(_.template(sql)({uid: uid}), function (err, rows) {
      callback(err, rows);
    });
  };
  async.map(sqls, query, function (err, res) {
    cb(err, res);
  });
};