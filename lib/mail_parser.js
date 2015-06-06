/**
 * Created by zhaolei on 15/5/6.
 */

'use strict';

var fs = require('fs');
var _ = require('lodash');
var debug = require('debug')('parser');

var PARSER_PATH = __dirname + '/mail_parser/';

var __parsers = [];

(function loadAllParsers() {
  var files = fs.readdirSync(PARSER_PATH);
  files = _.filter(files, function (f) {
    if (_.startsWith(f, '.')) {
      return false;
    }
    return _.endsWith(f, '.js');
  });
  _.forEach(files, function (f) {
    __parsers.push(require(PARSER_PATH + f));
  });
})();

var Parser = module.exports = function (options) {
  this.subject = options.subject;
  this.content = this._clean(options.content);
};

Parser.prototype._clean = function (str) {
  return String(str)
    .replace(/\s/g, ' ')
    .replace(/ +/g, ' ');
};

Parser.prototype._getParser = function (subject) {
  debug('Subject:|%s|',subject);
  for (var i = 0; i < __parsers.length; i++) {
    debug('RegExp:',__parsers[i].regExp);
    
    if(subject.match(__parsers[i].regExp)){
      return __parsers[i];
    }  
  }
  throw new Error('No parser for this subject.');
};

// 非异常安全
Parser.prototype.parse = function () {
  var self = this;
  var p = self._getParser(self.subject);
  return p.execute(self.content);
};

