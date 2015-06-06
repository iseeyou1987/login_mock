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

/**
 * 导入指定用户的邮箱账单
 * @param {[type]} uid           [description]
 * @yield {[type]} [description]
 */
function *run(uid){
  try{
    var mailInfo = yield getAccount(uid);  
  }catch(e){
    throw e;
    return;
  }
  
  var username = mailInfo['email'];
  var password = fog.decode(mailInfo['password']);

  if (!mailInfo['last_import'] || _.isEmpty(mailInfo['last_import'])) {
    mailInfo.last_import = moment().subtract(3, 'months').startOf('month').format('YYYY-MM-DD');
  }

  var readdir = thunkify(fs.readdir);

  var mockers_files = yield readdir(__mockerDir);
  var fetchers_files = yield readdir(__fetcherDir);
  var parsers_files = yield readdir(__parserDir);

  __mockers = yield loadMockers(mockers_files);
  __fetchers = yield loadFetchers(fetchers_files);
  __parsers = yield loadParsers(parsers_files);

  var _found = false;
  var cookie = '';
  for (var i = 0; i < __mockers.length; i++) {
    var m = __mockers[i];
    if (m.test(username)) {
      _found = true;

      try{
        cookie = yield m.getCookie(username, password);
      }catch(err){
        throw new Error(err);
        return;
      }
      break;
    }
  }
  if (!_found) {
    throw new Error('No mocker found.');
    return;
  }

  if(cookie){
    var fetcher_state = false;
    for(var i=0;i<__fetchers.length;i++){
      var m = __fetchers[i];
      if(m.test(username)){
        var fetcher = new m.Fetcher({'cookie':cookie});
        var ev = eventWrap(fetcher);
        ev.on('message', function* (data) {
          //判断邮箱是都需要进行
          try{
            var parse_res = yield parseBill(data['subject'],data['content']);
            //处理逻辑
            debug(parse_res);
          }catch(e){
            //parser Error 暂未处理  处理后会导致整个循环的parse终止
          }
        });

        ev.on('error', function* (error) {
          throw error;
        });

        ev.on('end', function* (data){
          return true;
        });

        var res = yield fetcher.getContent();

        fetcher_state = true;
        break;
      }
    }

    if(!fetcher_state){
      throw new Error('Fetcher Not Match');
      return;
    }
  }
}

module.exports = co.wrap(run);