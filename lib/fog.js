/**
 * Created by zhaolei on 15/5/7.
 */

'use strict';

module.exports.encode = function (str) {
  return (new Buffer(str)).toString('base64').split('').reverse().join('');
};

module.exports.decode = function (str) {
  return new Buffer(str.split('').reverse().join(''), 'base64').toString();
};
