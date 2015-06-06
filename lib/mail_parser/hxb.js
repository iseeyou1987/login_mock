/**
 * 中国建设银行信用卡龙卡信用卡对账单 parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('hxb');

module.exports.regExp = /.*华夏信用卡-电子账单.*/g;
module.exports.execute = function (str) {
	var bank_name = '华夏银行信用卡';
	var bank_code = '';
	var limit_money = 0;
	var expired_date = '';
  var clean = function(arr, value) {
    return arr.filter(function(a) {
      return a !== value;
    });
  };

  var result = {};

  var author = str.match(/尊敬的(.*?) 先生：/g);
  var account = author[0].replace(/尊敬的(.*?) 先生：/g,'$1').replace(/ /g,'');
  var parts = str.match(/<tbody>(.+?)<\/tbody>/g);

	expired_date = _.chunk(parts[2].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' '),4)[2][1].replace(/\//g,'-');
	limit_money = _.chunk(parts[2].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' '),4)[3][2].replace(/,/g,'');

  parts = parts.map(function (p) {
    return p.replace(/ /g,'').replace(/<[^>]*>/g, ' ').replace(/ +/g, ' ');
  });

  parts = clean(parts,' ');
  parts = parts[7].split(' ');
  parts = clean(parts,'');

  parts = parts.slice(11,parts.length);
  parts = _.chunk(parts, 5);

  result.records = [];
  _.forEach(parts, function (r) {
      if(r.length == 5){
        var record = new Record();
        record.rtime = moment([r[1], '00:00:00'].join(' '), 'YYYY/MM/DD HH:mm:ss').unix();
        record.money = r[3].replace('&nbsp;','').replace(/¥/g,'');
        record.content = r[2].replace('&nbsp;','');
	      record.bank_name = bank_name;
	      record.bank_account = account;
	      record.bank_code = r[4];
	      record.limit_money = limit_money;
	      record.expired_date = expired_date;
        result.records.push(record);
      }
  });

  return result;
};