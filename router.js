/**
 * Created by zhaolei on 15/5/19.
 */

var router = require('koa-router')();
var koaBody = require('koa-body');

router.all('/cookie', koaBody(), require('./api/cookie'));

module.exports = router;

