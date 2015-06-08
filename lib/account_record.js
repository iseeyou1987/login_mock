/**
 * Created by davidzhang on 15/5/27.
 */

var sqlBuilder = require('../lib/sql_builder');
var debug = require('debug')('account');
var async = require('async');
var mysql = require('../lib/mysql');
var _ = require('lodash');
var moment = require('moment');
var recordMap = require('../lib/record_map');

module.exports = function(options,callback) {
  //用户uid
  var uid = options.uid;
  //要操作的内容
  var content = options.record.content;
  //银行名称
  var bank_name = options.record.bank_name;
  //银行卡号
  var bank_code = options.record.bank_code;
  //到日期
  var expired_date = options.record.expired_date ? options.record.expired_date : 0;
  //限额
  var limit_money = options.record.limit_money;

  async.waterfall([
    function(done){//获取用户record_type 支出的类型
      var record_type_id = '';

      //这里需要一个更完善的做法，例如机器学习 - 目前正则匹配
      recordMap.recordReg.some(function(i){
        return i.regExp.some(function(m){
          if(content.match(eval(m))){
            record_type_id = i.rt_id;
            return true;
          }
        });
      });

      if(!record_type_id){
        record_type_id = 1;//默认一般
      }
      done(null, record_type_id);
    },
    function(record_type_id,done){//获取用户account_type
      var sql = "SELECT name AS content, account_id AS id FROM qeeniao.account WHERE" +
        " user_id = ${uid}" +
        " AND" +
        " is_deleted = 0";
      sql = _.template(sql)({uid: uid});
      mysql.strictQuery(sql, function (err, res) {
        if (err) return done(err);
        if (_.isEmpty(res)) return done(new Error('No Account Type info for this user.'));
        var accountId = '';
        debug('Account Result:',res);

        //这里需要一个更完善的做法，例如机器学习
        res.some(function(i){
          var regCode;
          if(!bank_code){
            if(i.content.match(/信用卡/g)){
              accountId = i.id;
              return true;
            }
          }else{
            reg_bank_code = bank_code.substr(-4);
            regCode = '/'+reg_bank_code+'/g';

            if(i.content.match(/信用卡/g) && i.content.match(eval(regCode))){
              accountId = i.id;
              return true;
            }
          }
        });

        if(accountId){
          done(null, {'accountId': accountId,'recordTypeId':record_type_id});
        }else{
          var account_id = moment().valueOf();
          addAccountCard({
            'user_id':uid,
            'content':bank_name,
            'mtime':moment().unix(),
            'money':limit_money,
            'account_id':account_id,
            'name':'信用卡' + (bank_code ? '（尾号' + bank_code.substr(-4) +'）' : ''),
            'color':'45bdb3'
          },function(err,res){
            if(err) return done(err);
            done(null, {'accountId': account_id,'recordTypeId':record_type_id});
          });
        }
      });
    }
  ],function(err,res){
    if(err) return callback(err);
    callback(null,{'accountId':res.accountId,'recordTypeId':res.recordTypeId});
  });
};

/**
 * 添加账簿的账户
 * @param data
 */
var addAccountCard = function(data,callback){
  var sql = "SELECT type_id,user_id,content FROM qeeniao.account_type where user_id = ${uid} and content='信用卡' order" +
    " by" +
    " type_id DESC";
  sql = _.template(sql)({uid:data.user_id});
  debug(sql);
  mysql.strictQuery(sql, function (err, res) {
    if (err) return callback(err);
    if (_.isEmpty(res)) return callback(new Error('No Account Type info for this user.'));
    res = _.first(res);
    data['at_id'] = res.type_id;
    var sql = sqlBuilder.makeInsertSql('qeeniao.account', data);
    debug(sql);

    mysql.query(sql, function (err, res) {
      return callback(err, res);
    });
  });
};
