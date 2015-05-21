'use strict';
require('gnode');
var koa = require('koa');
var router = require('./router');

var app = koa();

app.use(router.routes());

app.listen(3000);
