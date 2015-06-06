/**
 * 浦发银行信用卡 parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('spdbccc');

module.exports.regExp = /.*浦发银行-信用卡电子账单.*/g;
module.exports.execute = function (str) {
	var bank_name = '浦发银行信用卡';
	var bank_code = '';
	var limit_money = 0;
	var expired_date = '';

  var clean = function(arr, value) {
    return arr.filter(function(a) {
      return a !== value;
    });
  };

  var author = str.match(/尊敬的(.*?)：/g);
  var account = author[0].replace(/尊敬的(.*?)：/g,'$1').replace(/ /g,'');
  
  var result = {};
  var parts = str.match(/<tbody>(.+?)<\/tbody>/g);

	limit_money = _.chunk(parts[4].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' '),5)[1][4].replace(/,/g,'');
	expired_date = _.chunk(parts[5].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' '),6)[2][4].replace(/\//g,'-');
  parts = parts.map(function (p) {
    var t =  p.replace(/ /g,'').replace(/<[^>]*>/g, ' ').replace(/ +/g, ' ');
    return t.split(' ').length > 13 ? t : '';
  });
  parts = clean(parts,'');

  parts = parts[3].split(' ');
  parts = parts.slice(11,parts.length - 1);

  var records = _.chunk(parts,5);
  result.records = [];
  _.forEach(records, function (r) {
    var record = new Record();

    record.rtime = moment([r[1], '00:00:00'].join(' '), 'YYYY/MM/DD HH:mm:ss').unix();
    record.money = r[4];
    record.content = r[2].replace(/&nbsp;/g,'');
	  record.bank_name = bank_name;
	  record.bank_account = account;
	  record.bank_code = r[3];
	  record.limit_money = limit_money;
	  record.expired_date = expired_date;
    result.records.push(record);
  });
  return result;
};