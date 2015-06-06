/**
 * 中国建设银行信用卡龙卡信用卡对账单 parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('ccb');

module.exports.regExp = /.*中国建设银行信用卡龙卡信用卡对账单.*|.*中国建设银行信用卡电子账单.*/g;
module.exports.execute = function (str) {
	var bank_name = '建设银行信用卡';
	var bank_code = '';
	var limit_money = 0;
	var expired_date = '';

  var clean = function(arr, value) {
    return arr.filter(function(a) {
      return a !== value;
    });
  };

  var author = str.match(/尊敬的(.*?)，您好/g);
  var account = author[0].replace(/尊敬的(.*?)，您好/g,'$1').replace(/ /g,'');

  var result = {};
  var parts = str.match(/<table width="875" cellPadding='0' cellSpacing='0'>(.+?)<\/table>/g);

	var info = str.replace(/\r|\n/g,' ').replace(/\r\n/g,' ').match(/<table border='1' cellpadding="0" cellspacing="0" width='100%'>(.+?)<\/table>/g);

	info = _.chunk(clean(info[0].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' '),''),6);

	expired_date = info[1][5];
	limit_money = info[2][4].replace(/,/g,'');

  parts = parts.map(function (p) {
    return p.replace(/ /g,'').replace(/<[^>]*>/g, ' ').replace(/ +/g, ' ');
  });
  
  parts = parts[1].replace(/【交易明细】 /g,'').split(' ');
  parts = clean(parts,'');
  parts = parts.slice(15,parts.length);
	parts = _.chunk(parts, 8);

  result.records = [];
  _.forEach(parts, function (r) {
      if(r.length > 7){
        var record = new Record();
        record.rtime = moment([r[0].replace(/-/g,'/').replace('&nbsp;',''), '00:00:00'].join(' '), 'YYYY/MM/DD HH:mm:ss').unix();
        record.money = r[7].replace('&nbsp;','');
        record.content = r[3].replace('&nbsp;','');
	      record.bank_name = bank_name;
	      record.bank_account = account;
	      record.bank_code = r[2].replace(/&nbsp;/g,'');
	      record.limit_money = limit_money;
	      record.expired_date = expired_date;
        result.records.push(record);
      }
  });

  return result;
};