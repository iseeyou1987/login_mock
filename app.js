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

app.use(app.oauth.authorise());
app.use(serve('./static/'));
app.use(logger());
app.use(router.routes());

app.on('apiError', function(err, ctx){
  console.log('apiError server error:', err, ctx);
});

app.listen(3050);