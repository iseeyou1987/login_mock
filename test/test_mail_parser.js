'use strict';
/**
 * parser测试
 */
var MailParser = require('../lib/mail_parser');
var should = require('should');
var fs = require('fs');
var _ = require('lodash');
var debug = require('debug')('test_mail_parser');
var path = require('path');

describe('mail parser', function () {
  it('should parse "ccsvc" mail fine', function *() {
    var parser = new MailParser({
      subject: '平安一账通卡电子账单',
      content: fs.readFileSync(__dirname + '/data/content_3_result.txt')
    });
    var result = yield parser.parse();
    debug(_.size(result.records));
    debug(result.records);
  });
});