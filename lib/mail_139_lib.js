'use strict';

var Mail139 = {
  getTips: function(a) {
    if (23 == a) return {
      m: '您已关闭邮箱服务，如需继续使用，<a target="_blank" href="' +
        ("http://mail.10086.cn/s?func=login:jumpToSSO&sid=" + this.Param.sid + "&extContent=sourceid%3D3%26to%3D9%26optype%3D3&cguid=" + Util.getCGUID()) + '">立即开启？</a>',
      t: "user",
      c: 0
    };
    if (27 == a) return a = Util.htmlEncode(this.Param.p), {
      m: '手机号可能已销号，请使用通行证号<span class="c_tipsTxt" title="点击填充" style="cursor:pointer;" onclick="javascript:$E(\'txtUser\').value=' + a + ";indexLogin.bindNum=" + a + ";indexLogin.addUnbindParams();indexLogin.hideBubble();$E('txtPass').focus();statisticAdapter('login_unbindPassportClick')\">" + a + "</span>登录。",
      t: "user",
      c: 0
    };
    219 == a && this.switchLoginType("Sms");
    return {
      1: {
        m: "帐号或密码错误，请重新输入",
        t: "middle",
        c: 0
      },
      2: {
        m: '帐号不存在，<a target="_blank" href="/s?func=umc:rdirectTo&amp;_fv=4&amp;optype=2&amp;mobile=1">立即注册</a>',
        t: "user",
        c: 0
      },
      4: {
        m: '帐号不存在，<a target="_blank" href="/s?func=umc:rdirectTo&amp;_fv=4&amp;optype=2&amp;mobile=1">立即注册</a>',
        t: "user",
        c: 0
      },
      3: {
        m: '您已关闭邮箱服务，如需继续使用，<a target="_blank" href="https://www.cmpassport.com">请登录通行证开启</a>',
        t: "user",
        c: 0
      },
      5: {
        m: "您的帐号发送垃圾邮件过多，系统已将其冻结，请使用短信登录进行解冻",
        t: "middle",
        c: 0
      },
      6: {
        m: "登录操作错误次数达到了系统限制，请在30分钟后再试",
        t: "middle",
        c: 0
      },
      7: {
        m: "由于网络或系统原因，暂时无法登录。请稍后再试",
        t: "middle",
        c: 0
      },
      10: {
        m: "您的139邮箱帐号被暂时冻结。如手机欠费充值24小时后仍不能登录，请致电10086",
        t: "middle",
        c: 0
      },
      11: {
        m: "操作过于频繁，为保障安全，请进行图片验证",
        t: "verifyCode",
        c: 0
      },
      21: {
        m: "您的帐号因发送垃圾邮件过多，系统已将其冻结，请联系客服",
        t: "middle",
        c: 0
      },
      24: {
        m: "为验证您的身份，请获取短信密码登录",
        t: "user",
        c: 0
      },
      100: {
        m: "请输入帐号",
        t: "user",
        c: 0
      },
      101: {
        m: "请输入邮箱密码",
        t: "pass",
        c: 0
      },
      102: {
        m: "帐号或密码错误，密码区分大小写",
        t: "middle",
        c: 0
      },
      103: {
        m: "操作过于频繁，为保障安全，请输入图片验证码",
        t: "verifyCode",
        c: 0
      },
      104: {
        m: "您输入的验证码不正确，请重新输入",
        t: "verifyCode",
        c: 0
      },
      153: {
        m: "请输入短信验证码",
        t: "sms",
        c: 0
      },
      201: {
        m: "请输入验证码",
        t: "verifyCode",
        c: 0
      },
      202: {
        m: "验证码错误，请重新输入",
        t: "verifyCode",
        c: 0
      },
      203: {
        m: "验证码异常，请重试",
        t: "verifyCode",
        c: 0
      },
      204: {
        m: "验证码已失效，请重新输入",
        t: "verifyCode",
        c: 0
      },
      205: {
        m: "验证码操作太过频繁，请稍后再试",
        t: "verifyCode",
        c: 0
      },
      219: {
        m: "您的帐号因发送垃圾邮件过多，系统已将其冻结，请使用短信登录进行解冻",
        t: "middle",
        c: 0
      },
      301: {
        m: "快速登录凭证为空",
        t: "middle",
        c: 0
      },
      302: {
        m: "快速登录凭证过期",
        t: "middle",
        c: 0
      },
      303: {
        m: "快速登录失败",
        t: "middle",
        c: 0
      },
      305: {
        m: "非号码归属地登录，为保障安全，请输入图片验证码",
        t: "verifyCode",
        c: 0
      },
      999: {
        m: "由于网络或系统原因，暂时无法登录。请稍后再试",
        t: "middle",
        c: 0
      },
      800: {
        m: "请输入手机号",
        t: "mobile",
        c: 0
      },
      801: {
        m: "短信验证码已发送到您的手机，请注意查收",
        t: "sms",
        c: 1
      },
      888: {
        m: "验证码10分钟内只能获取3条，请稍后再试",
        t: "sms",
        c: 0
      },
      889: {
        m: "请输入正确的手机号",
        t: "mobile",
        c: 0
      },
      890: {
        m: "该帐号没有注册",
        t: "mobile",
        c: 0
      },
      891: {
        m: "获取验证码失败，请重试",
        t: "sms",
        c: 0
      },
      892: {
        m: "大写锁定已打开",
        t: "pass",
        c: 0
      },
      895: {
        m: "中国移动用户默认已注册，可直接使用短信登录",
        t: "mobile",
        c: 1
      },
      1110: {
        m: "请输入邮箱密码",
        t: "pass",
        c: 1
      },
      1111: {
        m: "请使用新密码登录",
        t: "pass",
        c: 1
      }
    }[a]
  },
  makeUrl: function(a, b, d) {
    b += "=";
    var c = a.indexOf(b);
    return a = 0 > c ? a + ((0 > a.indexOf("?") ? "?" : "&") + b + d) : a.substring(0, c + b.length) + d + a.substring(0 > a.indexOf("&", c + b.length) ? a.length - 1 : a.indexOf("&", c + b.length))
  },
  base64Decode: function(a) {
    var b = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1],
      d, c, f, e, g;
    e = a.length;
    f = 0;
    for (g = ""; f < e;) {
      do d = b[a.charCodeAt(f++) & 255]; while (f < e && -1 == d);
      if (-1 == d) break;
      do c = b[a.charCodeAt(f++) &
        255]; while (f < e && -1 == c);
      if (-1 == c) break;
      g += String.fromCharCode(d << 2 | (c & 48) >> 4);
      do {
        d = a.charCodeAt(f++) & 255;
        if (61 == d) return g;
        d = b[d]
      } while (f < e && -1 == d);
      if (-1 == d) break;
      g += String.fromCharCode((c & 15) << 4 | (d & 60) >> 2);
      do {
        c = a.charCodeAt(f++) & 255;
        if (61 == c) return g;
        c = b[c]
      } while (f < e && -1 == c);
      if (-1 == c) break;
      g += String.fromCharCode((d & 3) << 6 | c)
    }
    return g
  },
  sha1: function(a) {
    function b(a, b) {
      var c = (a & 65535) + (b & 65535);
      return (a >> 16) + (b >> 16) + (c >> 16) << 16 | c & 65535
    }
    for (var d = [], c = 0; c < 8 * a.length; c += 8) d[c >> 5] |= (a.charCodeAt(c / 8) & 255) <<
      24 - c % 32;
    a = 8 * a.length;
    d[a >> 5] |= 128 << 24 - a % 32;
    d[(a + 64 >> 9 << 4) + 15] = a;
    a = Array(80);
    for (var c = 1732584193, f = -271733879, e = -1732584194, g = 271733878, j = -1009589776, k = 0; k < d.length; k += 16) {
      for (var l = c, m = f, n = e, p = g, q = j, h = 0; 80 > h; h++) {
        a[h] = 16 > h ? d[k + h] : (a[h - 3] ^ a[h - 8] ^ a[h - 14] ^ a[h - 16]) << 1 | (a[h - 3] ^ a[h - 8] ^ a[h - 14] ^ a[h - 16]) >>> 31;
        var r = b(b(c << 5 | c >>> 27, 20 > h ? f & e | ~f & g : 40 > h ? f ^ e ^ g : 60 > h ? f & e | f & g | e & g : f ^ e ^ g), b(b(j, a[h]), 20 > h ? 1518500249 : 40 > h ? 1859775393 : 60 > h ? -1894007588 : -899497514)),
          j = g,
          g = e,
          e = f << 30 | f >>> 2,
          f = c,
          c = r
      }
      c = b(c, l);
      f = b(f, m);
      e = b(e,
        n);
      g = b(g, p);
      j = b(j, q)
    }
    d = [c, f, e, g, j];
    a = "";
    for (c = 0; c < 4 * d.length; c++) a += "0123456789abcdef".charAt(d[c >> 2] >> 8 * (3 - c % 4) + 4 & 15) + "0123456789abcdef".charAt(d[c >> 2] >> 8 * (3 - c % 4) & 15);
    return a
  },
  getCGUID: function() {
    function a(a, b) {
      var f = (b || 2) - (1 + Math.floor(Math.log(a | 1) / Math.LN10 + 1E-15));
      return Array(f + 1).join("0") + a
    }
    var b = new Date;
    return "" + a(b.getHours()) + a(b.getMinutes()) + a(b.getSeconds()) + a(b.getMilliseconds(), 3) + a(Math.ceil(9999 * Math.random()), 4)
  },
}

module.exports = Mail139;