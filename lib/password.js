"use strict";

var crypto = require("crypto");

module.exports = function (salt, password) {
  var md5 = crypto.createHash("md5");
  md5.update(salt + password);
  return md5.digest("hex");
};