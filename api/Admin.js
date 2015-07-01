'use strict';

var _ = require('lodash');
var moment = require('moment');
var User = require('../lib/models/User');
var passwd = require('../lib/password');
var mysql = require('../lib/mysql');
var async = require('async');
var utils = require('../lib/utils');
var debug = require('debug')('Admin');
var fog = require('../lib/fog');
var EmailImport = require('../lib/models/EmailImport');

var _uid = utils.oauthUid;

module.exports.index = function *(next){
  this.body = yield this.render('index',{
  title:'Qeeniao',
  keywords:'Qeeniao',
  description:'Qeeniao'
  });
}

module.exports.mailImport = function *(next){
  var uid = _uid(this.request);
  var email = this.request.body.email;
  var pass = this.request.body.pass;
  var last_import = this.request.body.date;

  if (!uid || !email || !pass) {
    return this.throw('邮箱密码不能为空');
  }

  if(!last_import){
    last_import = moment().subtract(3, 'months').startOf('month').format('YYYY-MM-DD');
  }

  //one step
  var info_res;
  try{
    info_res = yield EmailImport.emailImportInfo(uid);
  }catch(error){
    return this.throw(error);
  }
  //two step
  //update / add rows
  if(_.isEmpty(info_res)){
    var records = {
      "user_id":uid,
      "email":email,
      "password":fog.encode(pass),
      "last_import":last_import
    };
    try{
      yield EmailImport.addEmailImport(records);
    }catch(error){
      return this.throw(error);
    }
  }else{
    try{
      yield EmailImport.updateEmailImport(email,pass,last_import,uid);
    }catch(error){
      return this.throw(error);
    }
  }
  
  try{
    var r = yield EmailImport.addQueue(uid);
    this.body = _.assign({'success':true,'taskid':r['insertId']});
  }catch(error){
    return this.throw(error);
  }
}


var taskQueueInfo = function(taskid){
  return new Promise(function(resolve,reject){
    var sql = "SELECT * FROM qeeniao.task_queue WHERE autokid = ${autokid}";
    sql = _.template(sql)({
      "autokid":taskid
    });
    mysql.strictQuery(sql,function(err,result){
      if(err) {return reject(err);}
      return resolve(result);
    });
  });
}

var emailImportResult = function(uid){
  return new Promise(function(resolve,reject){
    var sql = "SELECT * FROM qeeniao.email_import_info WHERE user_id = ${user_id}";
    sql = _.template(sql)({
      "user_id":uid
    });
    mysql.strictQuery(sql,function(err,result){
      if(err) {
        return reject(err);
      }
      result = _.first(result);
      return resolve(result);
    });
  });
}


/**
 * 账单状态查询
 * @param {Function} next          [description]
 * @yield {[type]}   [description]
 */
module.exports.mailBill = function *(next){
  var uid = _uid(this.request);
  var taskid = this.request.body.taskid;

  if (!uid || !taskid) {
    return this.throw('任务参数不能为空');
  }

  //one
  var queue_info;
  try{
    queue_info = yield taskQueueInfo(taskid);
  }catch(error){
    return this.throw(error);
  }
  if(!queue_info){
    return this.throw('没有找到正在进行的任务');
  }

  var first_res = _.first(queue_info);
  if(_.has(first_res,'task_info') && _.isEmpty(first_res['task_info'])){
    return this.throw('正在执行的任务出现问题');
  }

  debug('taskQueue Info:',first_res);
  if(first_res['task_flag'] == 900){
    try{
      var res_uid = JSON.parse(first_res['task_info']);
      var result = yield emailImportResult(res_uid['uid']);

      return this.body = _.assign({'code':900},{"user_id":result['user_id']},{'list':result['data']});
    }catch(error){
      return this.throw(error);
    }
    
  }else if((first_res['task_flag'] == 100 && first_res['trytimes'] != 0) || (first_res['task_flag'] == 200 && first_res['trytimes'] != 0)){
    var obj = {};
    obj['message'] = "导入邮箱进行中...";
    obj['code'] = first_res['task_flag'];
    return this.body = obj;
  }else{
    var obj = {};
    obj['message'] = "导入邮件失败,请重试";
    obj['code'] = 300;
    return this.body = obj;
  }
}