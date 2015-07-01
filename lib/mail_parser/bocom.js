/**
 * 交通银行信用卡电子账单 parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('bocom');
var htmlToText = require('html-to-text');

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

  //===========================HTML转文本
  str = str.toLowerCase();
  str = htmlToText.fromString(str,{ignoreHref:true,ignoreImage:true});

  //===========================账单列表
  var bill = str.match(/以下是您的消费、取现及其他费用明细 (.*?)*\n/g);

  var flag = false;
  if(_.size(bill) > 0){
    var rmb_sum = bill[0].match(/rmb/g);
    if(_.size(rmb_sum) > 1){
      flag = true;
    }
  }

  if(!_.size(bill) || !flag){
    bill = str.match(/人民币账户明细 主卡 卡号末四位 (.*?)*\n/g);
  }

  if(!_.size(bill)){
    throw new Error('第一步:账单信息为空!');
  }

  var tmp = [];
  var bill_regexp = /人民币账户明细 主卡 卡号末四位 (.*?)*\n/g;
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

  var bill_filter_res = [];
  _.forEach(bill,function(i){
    var bill_regexp = /人民币账户明细 主卡 卡号末四位 ((.*?)*)\n/g;
    var r = i.replace(bill_regexp,'$1');
    var rmb_sum = r.match(/rmb/g);
    r = r.split(' ');
    if(_.size(r) && _.size(rmb_sum) > 2){
      r = r.slice(1,r.length);
      var b = 0;
      var c = false;
      var d = '';
      var tmp = [];
      _.forEach(r,function(a){
        if(a.match(/[0-9]{4}\/[0-9]{2}\/[0-9]{2}/g)){
          c = true;
        }
        if(c){
          ++b;  
        }
        
        if(b>2 && a != 'rmb'){
          d += a;
        }else if(a == 'rmb'){
          if(d){
            tmp.push(d);
          }
          d = '';
          b = 0;
          c = false;
        }else{
          tmp.push(a);
        }
      });
      bill_filter_res.push(tmp);
    }
  });
  bill_filter_res = _.flatten(bill_filter_res);
  debug('bill_filter_res:',bill_filter_res);
  //===========================信用额度
  var limit_money_regexp = /信用额度 ￥ ([0-9.,]*) |信用额度\ncredit limit 人民币 rmb ([0-9.,]*)/g;
  limit_money = str.match(/信用额度 ￥ ([0-9.,]*) |信用额度\ncredit limit 人民币 rmb ([0-9.,]*)/g);
  if(_.size(limit_money)){
    var r;
    while(r = limit_money_regexp.exec(limit_money[0])){
      if(r[1] !== undefined){
        limit_money = r[1];
        break;
      }
      if(r[2] !== undefined){
        limit_money = r[2];
        break;
      }
    }
  }else{
    limit_money = '';
  }
  debug('limit_money:',limit_money);
  //===========================还款日期
  var expired_date_regexp = /到期还款日 ([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}) |到期还款日\npayment due day ([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}) /g;
  expired_date = str.match(expired_date_regexp);
  if(_.size(expired_date)){
    var r;
    while(r = expired_date_regexp.exec(expired_date[0])){
      if(r[1] !== undefined){
        expired_date = r[1];
        break;
      }
      if(r[2] !== undefined){
        expired_date = r[2];
        break;
      }
    }
  }else{
    expired_date = '';
  }
  debug('expired_date:',expired_date);
  //===========================银行卡号
  var bank_code_regexp = /卡号:([0-9*]*)\n/g;
  bank_code = str.match(bank_code_regexp);
  if(_.size(bank_code)){
    bank_code = bank_code[0].replace(bank_code_regexp,'$1');
  }else{
    bank_code = '';
  }
  debug('bank_code:',bank_code);

  //===========================生成结果
  result.records = [];
  if(!_.size(bill_filter_res)){
    throw new Error('第三步:账单信息为空');
  }
  var records = _.chunk(bill_filter_res,5)
  _.forEach(records, function (r) {
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