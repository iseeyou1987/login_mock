/**
 * Created by zhaolei on 15/5/19.
 */

var router = require('koa-router')();
var koaBody = require('koa-body');
var queryString = require('querystring');

router.post('/cookies',koaBody(),require('./api/cookie'));

router.all('/',function *(next){
  this.body = 'Hello World!';
});

module.exports = router;