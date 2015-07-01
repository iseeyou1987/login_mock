/**
 * Created by zhaolei on 12/19/14.
 */

"use strict";

module.exports.isAdmin = function isAdmin(req, res, next) {
  if (!req.session || !req.session.user || !req.session.user.is_admin) {
    return res.redirect('/admin/login');
  }
  next();
};
