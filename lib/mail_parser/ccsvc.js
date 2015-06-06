/**
 * Created by zhaolei on 15/5/6.
 */

'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('ccsvc');

module.exports.regExp = /.*招商银行信用卡消费明细.*/g;
module.exports.execute = function (str) {
	var bank_name = '招商银行信用卡';
	var limit_money = 0;
	var bank_code = '';
	var expired_date = '';

	var author = str.match(/<p>(.*?) 先生，您好！/g);
	var account = author[0].replace(/(.*?) 先生，您好！/g,'$1').replace(/<[^>]*>/g, ' ').replace(/ /g,'');

  var result = {};
  var parts = str.match(/<tbody>(.+?)<\/tbody>/g);
  parts = parts.map(function (p) {
    return p.replace(/<[^>]*>/g, ' ').replace(/ +/g, ' ');
  });
  parts = parts[1].split(' ').filter(function (item) {
    return item.length > 0;
  });
  var records = _.chunk(parts, 7);
  result.records = [];
  _.forEach(records, function (r) {
	  debug(r);
    var record = new Record();
    record.rtime = moment([r[1], r[2]].join(' '), 'YY/MM/DD HH:mm:ss').unix();
    record.money = r[4];
    record.content = r[6];
	  record.bank_name = bank_name;
	  record.bank_account = account;
	  record.bank_code = r[0];
	  record.limit_money = limit_money;
	  record.expired_date = expired_date;
    result.records.push(record);
  });
  return result;
};
