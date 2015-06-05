'use strict';

var koa = require('koa');
var router = require('./router');
var logger = require('koa-logger')

var app = koa();

app.use(logger());
app.use(router.routes());

app.listen(3050);