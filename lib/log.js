/**
 * Created by zhaolei on 12/16/14.
 */
"use strict";

var log4js = require('log4js');
var config = require('../config');

log4js.configure(config.log4js, {cwd: config.logDir});

module.exports = log4js;

