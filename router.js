/**
 * Created by zhaolei on 15/5/19.
 */

var router = require('koa-router')();
var koaBody = require('koa-body');
var views = require('co-views');

var render= views(__dirname + '/views',{ map: { html: 'swig' }});

router.all('/',function *(next){
  this.body = 'Hello World!';
});

//视图调用
router.all('/music',function*(next){
  this.body = yield render('index',{'user':'durban'});
});

router.all('/user',function*(next){
  this.body = 'user list'
});



router.all('/post',function*(){
  this.body = 'post list';
});

router.all('/entries', koaBody(), function*(){

});

module.exports = router;