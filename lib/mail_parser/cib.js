/**
 * 兴业银行信用卡 parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('cib');

module.exports.regExp = /.*兴业银行信用卡[0-9]{2}月电子账单.*/g;
module.exports.execute = function (str) {
  var bank_name = '兴业银行信用卡';
	var bank_code = '';
	var limit_money = 0;
	var expired_date = '';
	var clean = function(arr, value) {
    return arr.filter(function(a) {
      return a !== value;
    });
  };

  var author = str.match(/尊敬的 (.+?) 您好/g);
  var account = author[0].replace(/尊敬的 (.+?) 您好/g,'$1').replace(/ /g,'');

  var result = {};
  var parts = str.match(/<tbody>(.+?)<\/tbody>/g);

	bank_code = str.match(/卡号末四位 [0-9]{4}/g)[0].match(/([0-9]{4})/g)[0];

	var info = _.chunk(clean(parts[2].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' '),''),2);
	limit_money = info[3][1].replace(/,/g,'');
	expired_date = info[8][1].replace(/([0-9]{4})年([0-9]{2})月([0-9]{2})日/g,'$1-$2-$3');
  parts = parts.map(function (p) {

    p = p.replace(/<td> ([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2}) <\/td>/g,'<td>$1#$2</td>');

    var t =  p.replace(/<[^>]*>/g, ' ').replace(/ +/g, ' ');

    return t.split(' ').length > 18 ? t : '';
  });

  parts = clean(parts,'');

  parts = parts[4].split(' ');

  parts = parts.slice(19,parts.length - 1);
  var records = _.chunk(parts,4);
  
  result.records = [];
  _.forEach(records, function (r) {
    var record = new Record();

    record.rtime = moment([r[1], '00:00:00'].join(' '), 'YYYY-MM-DD HH:mm:ss').unix();
    record.money = r[3];
    record.content = r[2].replace(/&nbsp;/g,'');
	  record.bank_name = bank_name;
	  record.bank_account = account;
	  record.bank_code = bank_code;
	  record.limit_money = limit_money;
	  record.expired_date = expired_date;
    result.records.push(record);
  });
  return result;
};