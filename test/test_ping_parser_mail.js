'use strict';

var MailParser = require('../lib/mail_parser');
var should = require('should');
var fs = require('fs');
var _ = require('lodash');
var debug = require('debug')('mail_parser');
var path = require('path');

describe('mail parser', function () {
  it('should parse "ccsvc" mail fine', function (done) {
    var parser = new MailParser({
      subject: '平安一账通卡电子账单',
      content: fs.readFileSync(path.dirname(__dirname) + '/test/data/data_2_html.txt')
    });
    var result = parser.parse();
	  debug(_.size(result.records));
    debug(result.records);
    done();
  });
});
