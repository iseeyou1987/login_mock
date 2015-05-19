'use strict';

var koa = require('koa');
var router = require('koa-router');

var app = koa();

app.use(function* () {
  this.body = 'TTTTTT';
});

app.listen(3000);
