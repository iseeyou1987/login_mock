"use strict";

module.exports = {
  mysql : {
    hostname: "127.0.0.1",
    username: "root",
    password: "123456",
    database: "qeeniao",
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
