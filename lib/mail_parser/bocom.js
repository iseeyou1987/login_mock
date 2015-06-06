/**
 * 交通银行信用卡电子账单 parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('bocom');

module.exports.regExp = /.*交通银行信用卡电子账单.*/g;
module.exports.execute = function (str) {
  var bank_name = '交通银行信用卡';
	var bank_code = '';
	var limit_money = '';
	var expired_date = '';
	var clean = function(arr, value) {
    return arr.filter(function(a) {
      return a !== value;
    });
  };

  var result = {};

  var author = str.match(/尊敬的 (.+?)您好/g);
	var account = author[0].replace(/尊敬的 (.+?)您好/g,'$1').replace(/ /g,'');

  var parts = str.match(/<tbody>(.+?)<\/tbody>/g);

	limit_money = _.chunk(parts[3].replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/ +/g,' ').split(' '),6)[2][1];
	expired_date = _.chunk(parts[3].replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/ +/g,' ').split(' '),6)[3][4].replace(/\//g,'-');
	bank_code = parts[1].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' ')[8].replace(/卡号:/g,'');

  parts = parts.map(function (p) {
    var t =  p.replace(/ /g,'')//去掉全部中文字符间的空格
              .replace(/<[^>]*>/g, ' ')//去掉全部html标签
              .replace(/&nbsp;/g,' ')//将&nbsp;替换为一个空格
              .replace(/ +/g, ' ');//将多个空格替换为一个空格
    return t.split(' ').length > 13 ? t : '';
  });

  
  parts = clean(parts,'');
  var parts1 = parts[3].split(' ');
  parts1 = parts1.slice(13,parts1.length - 1);
  var records1 = _.chunk(parts1,7);

  var parts2 = parts[4].split(' ');
  parts2 = parts2.slice(13,parts2.length - 1);
  var records2 = _.chunk(parts2,7);
  
  result.records = [];
  records1.push.apply( records1, records2 ); 

  _.forEach(records1, function (r) {
    var record = new Record();

    record.rtime = moment([r[1], '00:00:00'].join(' '), 'YYYY/MM/DD HH:mm:ss').unix();
    record.money = r[4];
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