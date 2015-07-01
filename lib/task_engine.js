/**
 * api.qeeniao.com -
 * Created by zhaolei on 2/3/15.
 */

"use strict";
var _ = require("lodash");
var async = require("async");
var Queue = require("./task_queue");
var Log = require('./log').getLogger('task');

var Engine = module.exports = function Engine(options) {
  this.options = _.assign({
    sleep:  30*1000 // 30s
  }, options || {});
  this.app = options.app;
  this.executorMap = {};
};

Engine.prototype.run = function () {
  var self = this;
  Log.debug('run');
  // 注册下一次运行
  setTimeout(function () {
    Log.debug('next run');
    self.run();
  }, self.options.sleep);

  var q = new Queue({
    app: self.app
  });
  async.waterfall([
    // get tasks
    function (done) {
      q.get(function (err, rows) {
        if (err) {
          return done(err);
        }
        done(null, rows);
      });
    },
    function (rows, done) {
      if (_.isEmpty(rows)) { // nothing to do
        Log.info("No task to execute.");
        return done();
      }
      async.map(rows, _.bind(self._execute, self), function (err, results) {
        done(err, results);
      });
    }
  ], function (err) {
    if (err) {
      Log.error(err);
    }
  });
};

Engine.prototype._execute = function (task, callback) {
  Log.info('execute task %j', task);
  var self = this;
  var executor = self.executorMap[task.type];
  if (!executor) {
    return callback(new Error("No executor found. - " + task.type));
  }
  var q = new Queue({app: self.app});
  async.waterfall([
    function (done) {
      q.lock({ taskid: task.id }, function (err, res) {
        done(err);
      });
    },
    function (done) {
      executor.run(self.app, task.info, function (err, res) {
        done(err);
      });
    }
  ], function (err) {
    if(err) {
      // 如果抢锁失败直接返回
      if (err.name == "LockConflictError") {
        return callback();
      }
      q.fail({ taskid:task.id }, function () {
        callback(err);
      });
    } else {
      q.done({ taskid: task.id }, function (err) {
        callback(err);
      });
    }
  });
};

Engine.prototype.register = function (name, executor) {
  this.executorMap[name] = executor;
};