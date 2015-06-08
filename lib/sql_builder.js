/**
 * api.qeeniao.com -
 * Created by zhaolei on 1/29/15.
 */

"use strict";
var _ = require("lodash");
var moment = require('moment');
var nQuery = require('node-query');

var escape = function(val) {
  if (val === undefined || val === null) {
    return 'NULL';
  }

  if (val instanceof Date) {
    val = moment(val).format('YYYY-MM-DD HH:mm:ss');
  }

  switch (typeof val) {
    case 'boolean': return (val) ? 'true' : 'false';
    case 'number': return val+'';
  }

  val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
    switch(s) {
      case "\0": return "\\0";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\b": return "\\b";
      case "\t": return "\\t";
      case "\x1a": return "\\Z";
      default: return "\\"+s;
    }
  });
  return "'"+val+"'";
};

// TODO
// params 应是数组
module.exports.makeInsertSql = function(tableName, params) {
  var sql = "INSERT INTO ${table} (${columns}) VALUES ${values}";
  var columns;

  if (!_.isArray(params)) {
    params = [params];
  }

  var values = _.map(params, function(param) {
    if (!columns) {
      columns = _.keys(param);
    }
    return _.values(param).map(function(v) {
      return escape(v);
    });
  });

  return _.template(sql)({
    table: tableName,
    columns: columns.join(","),
    values: values.map(function(value) {
        return '(' + value.join(',') + ')';
      }).join(',')
      
  });
};

module.exports.makeUpdateSql = function (tableName, updateColumns, whereColumns) {
  var sql = "UPDATE ${table} SET ${columnUpdate} WHERE ${columnWhere}";
  var update = [];
  _.forEach(updateColumns, function (v, k) {
    if (_.isObject(v) && !_.isUndefined(v.phrase)) {
      update.push(k + "=" + (v.escape ?  escape(v.phrase) : v.phrase));
      return;
    }
    update.push(k + "=" + escape(v));
  });
  var where = [];
  _.forEach(whereColumns, function (v, k) {
    if (_.isObject(v) && !_.isUndefined(v.op) && !_.isUndefined(v.val)) {
      where.push(k + v.op + escape(v.val));
      return;
    }
    where.push(k + "=" + escape(v));
  });
  return _.template(sql)({
    table: tableName,
    columnUpdate: update.join(","),
    columnWhere: where.join(" AND ")
  });
};

module.exports.makeDeleteSql = function (tableName, whereColumns) {
  var sql = "DELETE FROM ${table} WHERE ${where}";
  var where = [];
  _.forEach(whereColumns, function(v, k) {
    where.push(k + "=" + escape(v));
  });
  return _.template(sql)({
    table: tableName,
    where: where.join(" AND ")
  });
};

module.exports.pickTableName = function(sql) {
  var tmpSql = _.trim(sql).replace(/\t|\n/g, ' ').replace(/ +/g, ' ');
  tmpSql = tmpSql.replace(/\?/g, '0'); // for node-mysql tplsql
  if (/^delete/i.test(tmpSql)) {
    return [tmpSql.split(' ')[2]];
  }
  try {
    var ast = nQuery.parse(tmpSql);
  } catch(e) {
    console.log('XXXXXXXX', tmpSql, e);
    return ['wrongSql'];
  }
  if (_.includes(['insert', 'update'], ast.type)) {
    return [ast.db ? [ast.db, ast.table].join('.') : ast.table];
  }
  return _.map(ast.from, function(f) {
    return f.db ? [f.db, f.table].join('.') : f.table;
  });
};

