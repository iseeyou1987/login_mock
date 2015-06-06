/**
 * Created by zhaolei on 15/5/19.
 */

var co = require('co');
var fs = require('fs');
var _ = require('lodash');
var thunkify = require('thunkify');
var debug = require('debug')('maindebug');

var __mockerDir = __dirname + '/../mockers';
var __mockers = [];

var load_mockers = function(files){
  return new Promise(function(resolve,reject){
    var n = [];
    files.forEach(function (f) {
      if (_.startsWith(f, '.') || !_.endsWith(f, '.js')) {
        return;
      }
      n.push(f);
      __mockers.push(require([__mockerDir, f].join('/')));
    });
    console.log('[%d] mockers loaded. [%s]', __mockers.length, n.join(','));
    resolve(__mockers);
  });
}

function *cookie(next) {
  var readdir = thunkify(fs.readdir);
  var files = yield readdir(__mockerDir);

  __mockers = yield load_mockers(files);

  if (this.method == 'POST') {
    var _body = this.request.body;
    if (!_body.username) {
      return this.throw('lost params `username`', 400);
    }
    if (!_body.password) {
      return this.throw('lost params `password`', 400);
    }
    var _found = false;

    for (var i = 0; i < __mockers.length; i++) {
      var m = __mockers[i];
      console.log('m:',m);
      if (m.test(_body.username)) {
        _found = true;

        try{
          var results = yield m.getCookie(_body.username, _body.password);
        }catch(err){
          console.log('Get Cookie:',err);
          return this.throw('获取Cookie失败', 400);
        }

        this.body = results;
        break;
      }
    }
    if (!_found) {
      this.throw('No mocker found.', 400);
    }
  }
}

module.exports = cookie;