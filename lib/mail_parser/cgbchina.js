/**
 * 广发卡 parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('cgbchina');

module.exports.regExp = /.*广发卡[0-9]{4}年[0-9]{2}月账单.*/g;
module.exports.execute = function (str) {
	var bank_name = '广发银行信用卡';
	var expired_date = '';
	var bank_code = '';
	var limit_money = 0;

  var result = {};
  var parts = str.match(/<tbody>(.+?)<\/tbody>/g);

  var clean = function(arr, value) {
    return arr.filter(function(a) {
      return a !== value;
    });
  };

	var info = parts[28].replace(/<[^>]*>/g, ' ').replace(/ +/g,' ').split(' ');
	//获取到期日
	expired_date = info[4].replace(/\//g,'-');
	//获取账号
	bank_code = info[1];
	//获取限额
	limit_money = info[6].replace(/,/g,'');
	//获取账单属主
  var author = str.match(/尊敬的(.*?)：/g);
  var account = author[0].replace(/尊敬的(.*?)：/g,'$1').replace(/ /g,'');
  
  parts = parts.map(function (p) {
    return p.replace(/ /g,'').replace(/<[^>]*>/g, ' ').replace(/ +/g, ' ');
  });

  parts = clean(parts,' ');
  parts = clean(parts,'');
  parts = clean(parts,' &nbsp; ');
  

  parts = parts[16].split(' ').filter(function (item) {
    return item.length > 0;
  });

  var records = _.chunk(parts, 6);

  result.records = [];
  _.forEach(records, function (r) {
    if(r.length == 6){
      var year = r[0].substr(0,4);
      var month = r[0].substr(4,2);
      var date = r[0].substr(6,2);
      
      var record = new Record();
      record.rtime = moment([year+'/'+month+'/'+date, '00:00:00'].join(' '), 'YYYY/MM/DD HH:mm:ss').unix();
      record.money = r[3].replace('&nbsp;','');
      record.content = r[2].replace('&nbsp;','');
	    record.bank_name = bank_name;
	    record.bank_account = account;
	    record.expired_date = expired_date;
	    record.limit_money = limit_money;
	    record.bank_code = bank_code;
      result.records.push(record);
    }
  });
  return result;
};