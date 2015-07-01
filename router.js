/**
 * Created by zhaolei on 15/5/19.
 */

var router = require('koa-router')();
var koaBody = require('koa-body');
var queryString = require('querystring');
var Admin = require('./api/Admin');

router.post('/cookies',koaBody(),require('./api/cookie'));

router.all('/',koaBody(), Admin.index);
router.post('/mail/import', Admin.mailImport);
router.post('/mail/billquery', Admin.mailBill);

module.exports = router;