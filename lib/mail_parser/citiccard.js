/**
 * 中信银行信用卡 parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('citiccard');

module.exports.regExp = /.*中信银行信用卡电子账单.*/g;
module.exports.execute = function (str) {
	var bank_name = '中信银行信用卡';
	var bank_code = '';
	var expired_date = '';
	var limit_money = 0;

  var clean = function(arr, value) {
    return arr.filter(function(a) {
      return a !== value;
    });
  };

  var author = str.match(/尊敬的(.*?)：/g);
  var account = author[0].replace(/尊敬的(.*?)：/g,'$1').replace(/ /g,'');
  
  var result = {};
  var parts = str.match(/<tbody>(.+?)<\/tbody>/g);

	limit_money = parts[32].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' ')[3].replace(/,/g,'');
	expired_date = parts[11].replace(/<[^>]*>/g,' ').replace(/ +/g,'').match(/最后还款日：(([0-9]{4})年([0-9]{2})月([0-9]{2})日)/g)[0].replace(/最后还款日：(([0-9]{4})年([0-9]{2})月([0-9]{2})日)/g,'$1').replace(/([0-9]{4})年([0-9]{2})月([0-9]{2})日/g,'$1-$2-$3');

  parts = parts.map(function (p) {
    var t = p.replace(/ /g,'').replace(/<[^>]*>/g, ' ').replace(/ +/g, ' ');

    if(t.split(' ').length == 12){
      return t;
    }
  });

  var records = clean(parts,undefined);
  
  result.records = [];
  _.forEach(records, function (t) {
    var record = new Record();
    var r = t.split(' ');
    var year = r[3].substr(0,4);
    var month = r[3].substr(4,2);
    var date = r[3].substr(6,2);
    record.rtime = moment([year+'/'+month+'/'+date, '00:00:00'].join(' '), 'YYYY/MM/DD HH:mm:ss').unix();
    record.money = r[8];
    record.content = r[6].replace(/&nbsp;/g,'');
	  record.bank_name = bank_name;
	  record.bank_account = account;
	  record.bank_code = r[5];
	  record.limit_money = limit_money;
	  record.expired_date = expired_date;
    result.records.push(record);
  });
  return result;
};