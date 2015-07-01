/**
 * 中国建设银行信用卡龙卡信用卡对账单 parser
 */
'use strict';
var _ = require('lodash');
var moment = require('moment');
var Record = require(__dirname + '/../data_structure/record');
var debug = require('debug')('pingan');

module.exports.regExp = /.*平安一账通卡电子账单.*/g;
module.exports.execute = function (str) {
	var bank_name = '平安一账通卡';
	var bank_code = '';
	var limit_money = 0;
	var expired_date = '';
	var clean = function(arr, value) {
		return arr.filter(function(a) {
			return a !== value;
		});
	};

	var ct = function(parts,section){
		var tmp = parts;
		section = parseInt(section);
		if(section > _.size(parts) || section == -1 ){
			return [];
		}

		var v = parts[section];
		v = v.split(' ');
		if(_.size(v) > 0){
			v = clean(v,'');
			var t = v[0];
			if(t.match(/交易种类/g)){
				return v;
			}else{
				return ct(tmp,parseInt(section - 1));
			}
		}else{
			return ct(tmp,parseInt(section - 1));
		}
	};

	var result = {};
	var account = '';
	var parts = str.match(/<tbody>(.+?)<\/tbody>/g);

	bank_code = str.match(/<strong>平安银行淘宝联名信用卡(.*?)<\/strong>/g)[0].match(/[0-9]+/g)[0];
	expired_date = parts[3].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' ')[5];
	limit_money = parts[3].replace(/<[^>]*>/g,' ').replace(/ +/g,' ').split(' ')[8].replace(/,/g,'');
	parts = parts.map(function (p) {
		return p.replace(/ /g,'').replace(/<[^>]*>/g, ' ').replace(/ +/g, ' ');
	});
	parts = clean(parts,' ');

	//兼容处理
	var v = ct(parts,13);
	parts = v;
	parts = parts.slice(13,parts.length);
	parts = _.chunk(parts, 4);

	result.records = [];
	_.forEach(parts, function (r) {
		if(r.length == 4){
			var record = new Record();
			record.rtime = moment([r[1].replace(/-/g,'/'), '00:00:00'].join(' '), 'YYYY/MM/DD HH:mm:ss').unix();
			record.money = r[3].replace('&nbsp;','').replace(/¥/g,'');
			record.content = r[2].replace('&nbsp;','');
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