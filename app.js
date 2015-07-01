'use strict';

var koa = require('koa');
var router = require('./router');
var logger = require('koa-logger');
var serve = require('koa-static');
var bodyParser = require('koa-bodyparser');
var oauthserver = require('koa-oauth-server');
var oauthModel =  require('./lib/oauth_model');
var render = require('koa-swig');
var path = require('path');
var app = koa();
var TaskEngine = require('./lib/task_engine');

app.oauth = oauthserver({
  model: oauthModel,
  grants: ["password", "refresh_token"],
  accessTokenLifetime: 3600*24*365,
  refreshTokenLifetime: 3600*24*365,
  debug: true
});

app.use(bodyParser());
router.all('/oauth/token', app.oauth.grant());

app.context.render = render({
  root: path.join(__dirname, 'views'),
  autoescape: true,
  cache: false, // disable, set to false
  ext: 'html'
  // locals: locals,
  // filters: filters,
  // tags: tags,  
  // extensions: extensions
});

/**
 * 统一处理默认Error
 */
app.use(function *(next) {
  try {
    yield next;
  } catch (err) {
    console.log('err.status',err);
    this.status = err.status || 500;
    this.body = {
      name: "QeeniaoApiServerError",
      code: err.status || 600,
      message: err.message || "Server internal error.",
      success: false
    }
  }
});


app.use(app.oauth.authorise());
app.use(serve('./static/'));
app.use(logger());
app.use(router.routes());
app.listen(3050);

//后台任务注册
var taskEngine = new TaskEngine({
  app: app
});
taskEngine.register("mockImportMail", require("./tasks/importEmail"));
try{
  taskEngine.run();
}catch(error){
  console.log('error:',error);
}