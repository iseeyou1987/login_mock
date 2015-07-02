"use strict";

var env = process.env['NODE_ENV'] || 'production';
env = env.toLowerCase();

module.exports = {
  mysql : {
    hostname: (env === 'dev') ? "127.0.0.1" : "qeeniaodb.mysql.rds.aliyuncs.com",
    username: (env === 'dev') ? "root" : "zhaolei",
    password: (env === 'dev') ? "123456" : "6070039",
    database: (env === 'dev') ? "qeeniao" : "qeeniao",
    port : 3306,
    poolSize : 10
  },
  logDir: __dirname + '/log/',
  log4js: {
    appenders: [
      {
        type: 'file',
        category: 'worker',
        filename: 'worker.log',
        maxLogSize: 1024 * 1024 * 2,
        backups: 3
      },
      {
        type: 'file',
        category: 'api',
        filename: 'api.log',
        maxLogSize: 1024 * 1024 * 2,
        backups: 3
      },
      {
        type: 'file',
        category: 'task',
        filename: 'task.log',
        maxLogSize: 1024 * 1024 * 2,
        backups: 3
      },
    ]
  },
};
