/**
 * Created by zhaolei on 15/5/6.
 */

'use strict';
var moment = require('moment');
var _ = require('lodash');

module.exports = function () {
  var now = moment().unix();
  this.content = '';
  this.money = 0;
  this.accountId = 1;
  this.userId = 0;
  this.uuid = _.random('200', '999') + '' + (+new Date() + '').substr(4, 10);
  this.recordTypeId = 1;
  this.ctime = now;
  this.rtime = now;
  this.mtime = now;
	this.bank_name = '';
	this.bank_account = '';
	this.bank_code = '';
	this.expired_date = '';
	this.limit_money = '';
};
