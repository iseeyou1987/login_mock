/**
 * 光大银行信用卡parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('cebbank');

module.exports.regExp = /.*光大银行信用卡电子对账单.*/g;
module.exports.execute = function (str) {
	var bank_name = '光大银行信用卡';
	var bank_code = '';
	var limit_money = 0;
	var expired_date = '';

  var author = str.match(/尊敬的 (.*?) 您好!/g);
  var account = author[0].replace(/尊敬的 (.*?) 您好!/g,'$1').replace(/ /g,'');
  
  var result = {};
  var parts = str.match(/<tbody>(.+?)<\/tbody>/g);
	var clean = function(arr, value) {
		return arr.filter(function(a) {
			return a !== value;
		});
	};

	var info = parts[1].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' ');
	info = clean(info,'');
	info = _.chunk(info,6)[4];
	expired_date = info[1].replace(/\//g,'-');
	limit_money = info[2].replace(/￥/g,'').replace(/,/g,'');
	bank_code = _.chunk(clean(parts[3].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' '),''),4)[3][2];
  parts = parts.map(function (p) {
    return p.replace(/ /g,'').replace(/<[^>]*>/g, ' ').replace(/ +/g, ' ');
  });


  parts = parts[7].split(' ').filter(function (item) {
    return item.length > 0;
  });
  parts = parts.slice(13,parts.length-6);
  var records = _.chunk(parts, 5);

  result.records = [];
  _.forEach(records, function (r) {
    if(r.length == 5){
      var record = new Record();
      record.rtime = moment([r[0], '00:00:00'].join(' '), 'YYYY/MM/DD HH:mm:ss').unix();
      record.money = r[4].replace('&nbsp;','');
      record.content = r[3].replace('&nbsp;','');
	    record.bank_name = bank_name;
	    record.bank_account = account;
	    record.bank_code = bank_code;
	    record.limit_money = limit_money;
	    record.expired_date = expired_date;
      result.records.push(record);
    }
    
  });
  return result;
};