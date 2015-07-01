/**
 * 光大银行信用卡parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('cebbank');
var htmlToText = require('html-to-text');

module.exports.regExp = /.*光大银行信用卡电子对账单.*/g;
module.exports.execute = function (str) {
	var bank_name = '光大银行信用卡';
	var bank_code = '';
	var limit_money = 0;
	var expired_date = '';

  //===========================HTML转文本
  str = str.toLowerCase();
  str = htmlToText.fromString(str,{ignoreHref:true,ignoreImage:true});
  debug('text str:',str);

  //==========================================账单列表
  var bill = str.match(/amount\(rmb\) ((.*?)*)\n/g);
  if(!_.size(bill)){
    throw new Error('第一步:账单信息为空!');
  }
  var bill_tmp = [];
  _.forEach(bill,function(b){
    b = b.split(' ');
    b = b.slice(1,b.length);
    var code_state = false;
    var content_state = false;
    var content = '';
    var tmp = [];
    for (var i = 0; i < b.length; i++) {
      var cu = b[i];
      if(cu.match(/^[0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}$/g)){
        tmp.push(cu);
      }else{
        var ne_index = parseInt(i) + 1;
        if(ne_index < b.length){
          var ne = b[ne_index];
          if(ne.match(/^[0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}$/g)){
            tmp.push(content);
            tmp.push(cu);
            code_state = false;
            content_state = false;
            content = '';
          }else if(!code_state){
            tmp.push(cu);
            code_state = true;
            content_state = true;
          }else if(content_state){
            content += cu;
          }
        }
      }
    };

    tmp = _.chunk(tmp,5);
    _.forEach(tmp,function(t){
      if(_.size(t) == 5){
        bill_tmp.push(t);
      }
    });
  });

  bill = _.flatten(bill_tmp);
  if(!_.size(bill)){
    throw new Error('第二步:账单信息为空!');
  }
  debug('bill:',bill);

  //==========================================账号姓名
  var author = str.match(/尊敬的 (.*?) 您好!/g);
  var account = author[0].replace(/尊敬的 (.*?) 您好!/g,'$1').replace(/ /g,'');
  debug('account:',account);

  //==========================================还款日期
  var regexp = /rewards points balance ([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}) ([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}) ￥([0-9,.]*) ￥([0-9,.]*) ￥([0-9,.]*) ([0-9]*)/g;
  var res = str.match(regexp);
  if(_.size(res)){
    expired_date = res[0].replace(regexp,'$2')
  }else{
    expired_date = '';
  }
  debug('expired_date:',expired_date);
  
  //==========================================信用额度
  if(_.size(res)){
    limit_money = res[0].replace(regexp,'$3')
  }else{
    limit_money = 0;
  }
  debug('limit_money:',limit_money);

  //==========================================卡号
  var bank_code_regexp = /account number：([0-9*]*)/g;
  bank_code = str.match(bank_code_regexp);
  if(_.size(bank_code)){
    bank_code = bank_code[0].replace(bank_code_regexp,'$1');
  }else{
    bank_code = '';
  }
  debug('bank_code:',bank_code);
 
  var records = _.chunk(bill, 5);

  var result = {};
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