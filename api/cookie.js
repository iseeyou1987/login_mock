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

// load mockers
function *load() {
  var readdir = thunkify(fs.readdir);
  var files = yield readdir(__mockerDir);
  var n = [];
  files.forEach(function (f) {
    if (_.startsWith(f, '.') || !_.endsWith(f, '.js')) {
      return;
    }
    n.push(f);
    __mockers.push(require([__mockerDir, f].join('/')));
  });
  console.log('[%d] mockers loaded. [%s]', __mockers.length, n.join(','));
}
co(load).catch(function (e) {
  console.error(e.stack);
  process.exit();
});

function *cookie(next) {
  yield* next;
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
      if (m.test(_body.username)) {
        _found = true;
        var results = yield m.getCookie(_body.username, _body.password);
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
