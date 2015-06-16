var cookieParser = require('cookie-js');
var fs = require('fs');
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);

describe('parser Cookie',function(){
  it('equal object',function *(){
    var cookieStr = yield readFile(__dirname+'/139_cookie.txt');
    cookieStr = cookieStr.toString();
    var cookieObj = cookieParser.parse(cookieStr);
    console.log('cookieObj:',cookieObj['Os_SSo_Sid']);
  })
})