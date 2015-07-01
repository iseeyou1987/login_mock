/**
 * 中国建设银行信用卡龙卡信用卡对账单 parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('hxb');
var htmlToText = require('html-to-text');

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

  //===========================HTML转文本
  str = str.toLowerCase();
  str = htmlToText.fromString(str,{ignoreHref:true,ignoreImage:true});
  debug(str);

  //==========================================账单列表
  var bill = str.match(/card number last 4 digits (.*?)*\n/g);
  if(!_.size(bill)){
    throw new Error('第一步:账单信息为空!');
  }
  var tmp = [];
  var bill_regexp = /card number last 4 digits (.*?)*\n/g;
  _.forEach(bill,function(i){
    var r = i.match(bill_regexp);
    if(_.size(r)){
      tmp.push(r);  
    }
  });
  bill = _.flatten(tmp);
  if(!_.size(bill)){
    throw new Error('第二步:账单信息为空!');
  }
  debug('bill:',bill);

  var bill_filter_res = [];
  _.forEach(bill,function(i){
    var bill_regexp = /card number last 4 digits ((.*?)*)\n/g;
    var r = i.replace(bill_regexp,'$1');
    r = r.split(' ');
    if(_.size(r)){
      _.forEach(r,function(a){
        bill_filter_res.push(a);
      });
    }
  });
  bill_filter_res = _.flatten(bill_filter_res);
  debug('bill_filter_res:',bill_filter_res);

  //==========================================账号姓名
  var author = str.match(/尊敬的(.*?) 先生：/g);
  var account = author[0].replace(/尊敬的(.*?) 先生：/g,'$1').replace(/ /g,'');
  debug('account:',account);

  //==========================================还款期限
  var expired_date_regexp = /payment due date: ([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2})/g;
  var expired_date = str.match(expired_date_regexp);
  if(_.size(expired_date)){
    expired_date = expired_date[0].replace(expired_date_regexp,'$1');
  }else{
    expired_date = '';
  }
  debug('expired_date:',expired_date);

  //==========================================信用额度
  var limit_money_regexp = /credit limit: ([0-9,.]*)/g;
  var limit_money = str.match(limit_money_regexp);
  if(_.size(limit_money)){
    limit_money = limit_money[0].replace(limit_money_regexp,'$1');
  }else{
    limit_money = 0;
  }
  debug('limit_money:',limit_money);
  
  var result = {};
  var records = _.chunk(bill_filter_res, 5);
  result.records = [];
  _.forEach(records, function (r) {
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