'use strict';

var _ = require('lodash');
var co = require('co');
var eventWrap = require('co-event-wrap');
var thunkify = require('thunkify');
var fs = require('fs');
var mysql = require('../lib/mysql');
var _ = require('lodash');
var moment = require('moment');
var Parser = require('../lib/mail_parser');
var debug = require('debug')('importEmail');
var fog = require('../lib/fog');
var Account_Record = require('../lib/account_record');
var sqlBuilder = require('../lib/sql_builder');
var async = require('async');
var writeFile = thunkify(fs.writeFile);

var __mockerDir = __dirname + '/../mockers';
var __mockers = [];

var __fetcherDir = __dirname + '/../lib/mail_fetcher';
var __fetchers = [];

var __parserDir = __dirname + '/../lib/mail_parser';
var __parsers = [];

var loadMockers = function(files){
  return new Promise(function(resolve,reject){
    var n = [];
    files.forEach(function (f) {
      if (_.startsWith(f, '.') || !_.endsWith(f, '.js')) {
        return;
      }
      n.push(f);
      __mockers.push(require([__mockerDir, f].join('/')));
    });
    console.log('[%d] mockers loaded. [%s]', __mockers.length, n.join(','));
    resolve(__mockers);
  });
}

var loadFetchers = function(files){
  return new Promise(function(resolve,reject){
    var n = [];
    files.forEach(function (f) {
      if (_.startsWith(f, '.') || !_.endsWith(f, '.js')) {
        return;
      }
      n.push(f);
      __fetchers.push(require([__fetcherDir, f].join('/')));
    });
    console.log('[%d] fetchers loaded. [%s]', __fetchers.length, n.join(','));
    resolve(__fetchers);
  });
}

var loadParsers = function(files){
  return new Promise(function(resolve,reject){
    var n = [];
    files.forEach(function (f) {
      if (_.startsWith(f, '.') || !_.endsWith(f, '.js')) {
        return;
      }
      n.push(f);
      __parsers.push(require([__parserDir, f].join('/')));
    });
    console.log('[%d] parsers loaded. [%s]', __parsers.length, n.join(','));
    resolve(__parsers);
  });
}

var getAccount = function(uid){
  return new Promise(function(resolve,reject){
    var sql = 'SELECT email,password,last_import FROM qeeniao.email_import_info WHERE user_id=${uid}';
    sql = _.template(sql)({uid: uid});
    mysql.strictQuery(sql, function (err, res) {
      if (err) return reject(err);
      if (_.isEmpty(res)) return reject(new Error('No email info for this user.'));
      resolve(_.first(res));
    });
  });
}

var freshLastImport = function(uid) {
  return new Promise(function(resolve,reject){
    var sql = 'UPDATE qeeniao.email_import_info SET last_import=\'${last}\' WHERE user_id=${uid}';
    sql = _.template(sql)({
      last: moment().format('YYYY-MM-DD'),
      uid: uid
    });
    mysql.query(sql, function (err, res) {
      if(err) return reject(err);
      return resolve(res);
    });
  });
  
}

var importData = function(records) {
  return new Promise(function(resolve,reject){
    var sql = sqlBuilder.makeInsertSql('qeeniao.record', records);
    debug('Insert Sql:',sql);
    mysql.query(sql, function (err, res) {
      if(err) return reject(err);
      return resolve(res);
    });
  });
}

/**
 * 添加用户银行卡
 * @param {[type]}   data     [description]
 * @param {Function} callback [description]
 */
var addUserCard = function(records){
  return new Promise(function(resolve,reject){
    var sql = sqlBuilder.makeInsertSql('qeeniao.user_has_card', records);
    debug('Add User Card Sql:',sql);
    mysql.query(sql, function (err, res) {
      if(err) return reject(err);
      return resolve(res);
    });
  });
}

/**
 * 解析账单
 * @param  {[type]}   subject  [description]
 * @param  {[type]}   contents [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
var parseBill = function(subject,contents){
  return new Promise(function(resolve,reject){
    try{
      var parser = new Parser({
        'subject':subject,
        'content':contents
      });
      resolve(parser.parse());
    }catch(e){
      reject(e);
    }
  });
}

var confirmInsertData = function(records,uid){
  return new Promise(function(resolve,reject){
    debug(records);
    var i = records[0];
    debug(i);
    var sql = 'SELECT id \
              FROM qeeniao.user_has_card \
              WHERE user_id = ${user_id} \
                    and bank_name="${bank_name}" \
                    and bank_account="${bank_account}" \
                    and bank_code="${bank_code}" \
                    and expired_date="${expired_date}"';

    sql = _.template(sql)({
      user_id: uid,
      bank_account:i.bank_account,
      bank_code:i.bank_code.substr(-4),
      expired_date:i.expired_date ? i.expired_date : '0000-00-00',
      bank_name:i.bank_name
    });
    mysql.query(sql,function(err,res){
      if(err) {
        reject(err);
        return false;
      }
      if(!_.size(res)){
        //添加用户银行卡记录
        try{
          var add_res = addUserCard({
            'user_id':uid,
            'bank_name':i.bank_name,
            'bank_code':i.bank_code.substr(-4),
            'bank_account':i.bank_account,
            'expired_date':i.expired_date,
            'limit_money':i.limit_money,
            'mtime':moment().unix()
          });
          resolve(true);
        }catch(e){
          reject(e);
          return false;
        }
        
      }else{
        resolve(false);
      }
    });
  });
}

var updateBillData = function(uid,data){
  return new Promise(function(resolve,reject){
    var sql = "UPDATE qeeniao.email_import_info SET data = '${data}' WHERE user_id = ${user_id}";
    sql = _.template(sql)({
      "user_id":uid,
      "data":data
    });
    debug('sql:',sql);
    mysql.strictQuery(sql,function(err,res){
      if(err){
        return reject(err);
      }
      return resolve(res);
    });
  });
  
}

var insertRecord = function(uid,records){
  return new Promise(function(resolve,reject){
    var insert_records = [];
    async.mapSeries(records,function(r,callback){
      // var r = records[i];
      
      debug(r);
      var money = r.money.replace(',','');
      new Account_Record({
          'uid':uid,record:{
            'content':r.content,
            'bank_name': r.bank_name,
            'bank_code': r.bank_code,
            'limit_money':r.limit_money,
            'expired_date':r.expired_date
          }
      },function (err,res){
        if (err) {
          reject(err);
          return false;
        };

        insert_records.push({
          'uuid': r.uuid,
          'user_id': uid,
          'rt_id': res.recordTypeId,
          'account_id': res.accountId,
          'money': money,
          'content': r.content,
          'bank_name': r.bank_name,
          'bank_code': r.bank_code,
          'limit_money':r.limit_money,
          'expired_date':r.expired_date,
          'ctime': r.ctime,
          'rtime': r.rtime,
          'mtime': r.mtime
        });
        callback(null,[]);
      });

    },function(err,res){
      debug('async insert records:',insert_records);
      resolve(insert_records);
    });
  });
}
/**
 * 导入指定用户的邮箱账单
 * @param {[type]} uid           [description]
 * @yield {[type]} [description]
 */
function *run(app,task,callback){
  debug('========================开始运行importEmail========================');
  var uid = task['uid'];
  if(!uid){
    throw new Error('任务参数错误!');
    return;
  }
  try{
    var mailInfo = yield getAccount(uid);  
  }catch(e){
    throw e;
    return;
  }
  debug('mailInfo:',mailInfo);
  
  var username = mailInfo['email'];
  var password = fog.decode(mailInfo['password']);

  if (!mailInfo['last_import'] || _.isEmpty(mailInfo['last_import'])) {
    mailInfo.last_import = moment().subtract(3, 'months').startOf('month').format('YYYY-MM-DD');
  }

  var readdir = thunkify(fs.readdir);

  try{
    var mockers_files = yield readdir(__mockerDir);
    var fetchers_files = yield readdir(__fetcherDir);
    var parsers_files = yield readdir(__parserDir);

    __mockers = yield loadMockers(mockers_files);
    __fetchers = yield loadFetchers(fetchers_files);
    __parsers = yield loadParsers(parsers_files);
  }catch(error){
    debug("readdir __mockers error",error.stack);
    throw error;
  }
  

  var _found = false;
  var cookie = '';
  debug("========================mockers 测试========================");
  console.log('__mockers:',__mockers);
  try{
    for (var i = 0; i < __mockers.length; i++) {
      var m = __mockers[i];
      debug("m:",m);
      if (m.test(username)) {
        _found = true;

        try{
          debug("========================开始模拟登录========================");
          cookie = yield m.getCookie(username, password);
          debug('cookie:',cookie);
        }catch(err){
          throw new Error(err);
          return;
        }
        break;
      }
    }
  }catch(error){
    debug("__mockers error",error);
    throw error;
  }
  

  if (!_found) {
    debug("No mocker found");
    throw new Error('No mocker found.');
    return;
  }

  if (_.isEmpty(cookie)) {
    throw new Error('登录失败');
    return;
  }

  var fetcher_state = false;
  debug("========================__fetchers 测试========================");
  console.log('__fetchers List:',__fetchers);
  for(var i=0;i<__fetchers.length;i++){
    var m = __fetchers[i];
    console.log('__fetchers:',m);
    //临时数据存储
    var tmp = [];
    if(m.test(username)){
      console.log('Select __fetchers:',m);
      var fetcher = new m.Fetcher({'cookie':cookie,'date':moment(mailInfo.last_import).toDate()});
      var ev = eventWrap(fetcher);
      var i = 0;
      
      ev.on('message', function* (data) {
        i++;
        var parse_res = [];
        try{
          debug('Email Subject:',data['subject']);
          parse_res = yield parseBill(data['subject'],data['content']);
        }catch(e){
          //parser Error 暂未处理  处理后会导致整个循环的parse终止
        }

        //判断是否需要插入数据
        var need_insert_state = true;
        // debug('parse_res:',parse_res);
        // if(!_.isUndefined(parse_res['records']) && !_.isEmpty(parse_res['records'])){
        //   try{
        //     need_insert_state = yield confirmInsertData(parse_res['records'],uid);
        //     debug('Need Insert Data State:',need_insert_state);
        //   }catch(e){
        //     throw(e);
        //     return false;
        //   }
        // }
        
        var insert_res = [];
        if(need_insert_state){
          try{
            if(_.has(parse_res,'records') && !_.isEmpty(parse_res['records'])){
              insert_res = yield insertRecord(uid,parse_res['records']);
            }
            debug('Insert Result:',insert_res);
          }catch(e){
            throw(e);
            return false;
          }
        }

        if(!_.isEmpty(insert_res)){
          try{

            _.forEach(insert_res,function(i){
              tmp.push(i);
            });

            debug('Tmp:',tmp);
            
            //var import_res = yield importData(insert_res);
          }catch(e){
            throw(e);
            return false;
          }
        }
        
        return;
      });

      ev.on('error', function* (error) {
        throw error;
      });

      ev.on('end', function* (data){
        //更新----问题这里的数据总是为空 不正常
        try{
          debug('Result:',tmp);
          if(!_.isEmpty(tmp)){
            yield updateBillData(uid,JSON.stringify(tmp));
          }else{
            debug('获取到的结果为空:',tmp);
            yield updateBillData(uid,'');
          }
          
        }catch(error){
          throw(error);
        }
        callback(null);
        return true;
      });

      var res = yield fetcher.getContent();

      fetcher_state = true;
      break;
    }
  }

  //fresh
  var fresh_res = freshLastImport(uid);

  if(!fetcher_state){
    throw new Error('Fetcher Not Match');
    return;
  }


  
}

module.exports.run = co.wrap(run);