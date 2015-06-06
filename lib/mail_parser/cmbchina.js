/**
 * 招商银行白金信用卡 parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('cmbchina');

module.exports.regExp = /.*招商银行白金信用卡.*/g;
module.exports.execute = function (str) {
	var bank_name = '招商银行白金信用卡';
	var expired_date = '';
	var bank_code = '';
  var result = {};
  var parts = str.match(/<tbody>(.+?)<\/tbody>/g);
  
  var datetime = str.match(/[0-9]{4}年([0-9]{2}|[0-9]{1})月([0-9]{1}|[0-9]{2})日/g);
  var year = datetime[0].substr(0,4);

	//获取到期日
	var expired_date_str = str.replace(/<[^>]*>/g,' ');
	expired_date_str = expired_date_str.match(/到期还款日.*?([0-9]{4}\/[0-9]{2}\/[0-9]{2})/g);
	expired_date = expired_date_str[0].replace(/到期还款日.*?([0-9]{4}\/[0-9]{2}\/[0-9]{2})/g,'$1').replace(/\//g,'-');

  parts = parts.map(function (p) {
    var t = p.replace(/<[^>]*>/g, ' ').replace(/ +/g, ' ');
    p = t.split(' ');
    if(p.length > 8) return _.trim(t);
  });

  var author = str.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/ +/g,' ');
  author = author.match(/亲爱的 (.+?)，/g);
  var account = author[0].replace(/亲爱的 (.+?)，/g,'$1').replace(/ /g,'');

  result.records = [];
  _.forEach(parts, function(t){
    if(t !== undefined){
      var m = t.match(/^[0-9]{4}|^&nbsp;/g);
      if(m){
        var records = t.split(' ');
        var month = records[1].substr(0,2);
        var date = records[1].substr(2,4);
        var timestamp = year+'/'+month+'/'+date;

        debug(records);
        var record = new Record();
        record.rtime = moment([timestamp, '00:00:00'].join(' '), 'YYYY/MM/DD HH:mm:ss').unix();
        record.money = records[3].replace(/&nbsp;/g,'').replace(/￥/g,'');
        record.content = records[2].replace(/&nbsp;/g,'');
	      record.bank_name = bank_name;
	      record.bank_account = account;
	      record.bank_code = records[4];
	      record.expired_date = expired_date;
        result.records.push(record);
      }
    }
  });
  return result;
};