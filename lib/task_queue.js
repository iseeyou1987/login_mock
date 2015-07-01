/**
 * api.qeeniao.com -
 * Created by zhaolei on 2/2/15.
 */

"use strict";
/**
 * TODO
 * 1. 加入时间条件 可以设定在某一个时间点之后运行
 */

var mysql = require("./mysql");
var _ = require("lodash");
var os = require("os");
var sqlBuilder = require("./sql_builder");
var ip = require("ip");
var moment = require('moment');

var FLAG = module.exports.FLAG = {
  "NEW": 0,
  "WAIT": 100,
  "LOCK": 200,
  "IGNO": 300,
  "DONE": 900
};

var DEFAULT_PRIORITY = 500;
var DEFAULT_TRYTIMES = 3;

var queue = null;

var Queue = module.exports = function Queue(options) {
  if (!options) {
    options = {};
  }
  this.options = options;
  this.name = options.name || "";
  this.mypos = ip.toLong(ip.address());
  this.table = "qeeniao.task_queue";
  this.app = options.app;
};

Queue.prototype.get = function (options, callback) {
  if ("function" == typeof options) {
    callback = options;
    options = {};
  }
  if (!options) {
    options = {};
  }
  var sql = '                                                 \
  SELECT autokid id,task_type type,task_info info             \
  FROM ${table}                                               \
  WHERE task_flag=${flag}                                     \
  AND ((agentpos=${pos} AND openrace=0) OR openrace=1)        \
  AND trytimes>0                                              \
  AND startime<=${now}                                        \
  ORDER BY priority ASC,trytimes ASC,ABS(agentpos-${pos}) ASC \
  LIMIT 0,${count}                                            \
  ';
  var self = this;
  mysql.strictQuery(_.template(sql)({
    pos: self.mypos,
    flag: options.flag || FLAG.WAIT,
    table : self.table,
    count: options.count || 1,
    now: mysql.escape(moment().format('YYYY-MM-DD HH:mm:ss'))
  }), function (err, rows) {
    if (err) {
      return callback(err);
    }
    try {
    _.forEach(rows, function (row) {
      row.info = JSON.parse(row.info);
    });
    } catch(e) {
      return callback(e);
    }
    callback(null, rows);
  });
};

Queue.prototype.add = function (options, callback) {
  var self = this;
  var map = {
    agentpos: self.mypos,
    openrace: options.openrace || 1,
    priority: options.priority || DEFAULT_PRIORITY,
    trytimes: options.trytimes || DEFAULT_TRYTIMES,
    addtime: new Date(),
    task_flag: options.flag || FLAG.WAIT,
    task_type: options.type || "default",
    owner: options.owner || os.hostname(),
    task_info: options.info,
    startime: options.startime || ''
  };
  mysql.strictQuery(sqlBuilder.makeInsertSql(self.table, map), function (err, rows) {
    if (err) {
      return callback(err);
    }
    callback(null, rows);
  });
};

Queue.prototype.lock = function (options, callback) {
  var self = this;
  mysql.strictQuery(sqlBuilder.makeUpdateSql(self.table, {
    task_flag: FLAG.LOCK,
    begtime: new Date()
  }, {
    autokid: options.taskid,
    task_flag: {
      op: "<",
      val: FLAG.LOCK
    }
  }), function (err, row) {
    if (err) {
      return callback(err);
    }
    if (1 !== parseInt(row.affectedRows)) {
      var e = new Error();
      e.message = "Task lock conflict. Lock failed.";
      e.name = "LockConflictError";
      return callback(e);
    }
    return callback(null, row);
  });
};

Queue.prototype.done = function (options, callback) {
  var self = this;
  mysql.strictQuery(sqlBuilder.makeUpdateSql(self.table, {
    task_flag: FLAG.DONE,
    endtime: moment().format('YYYY-MM-DD HH:mm:ss')
  }, {
    autokid: options.taskid
  }), function (err, row) {
    if (err) {
      return callback(err);
    }
    return callback(null, row);
  });
};

Queue.prototype.fail = function (options, callback) {
  var self = this;
  mysql.strictQuery(sqlBuilder.makeUpdateSql(self.table, {
    trytimes: {
      phrase:"trytimes-1",
      escape: false
    },
    endtime: moment().format('YYYY-MM-DD HH:mm:ss'),
    task_flag: FLAG.WAIT
  }, {
    autokid: options.taskid
  }), function (err, row) {
    if (err) {
      return callback(err);
    }
    return callback(err, row);
  });

};