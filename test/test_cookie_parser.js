var cookieParser = require('cookie-js');
var fs = require('fs');
var thunkify = require('thunkify');
var readFile = thunkify(fs.readFile);
var debug = require('debug')('cookie');

describe('parser Cookie',function(){
  it('equal object',function *(){
    var cookieStr = yield readFile(__dirname+'/cookie.txt');
    cookieStr = cookieStr.toString();
    try{
      var cookieObj = cookieParser.parse(cookieStr);
      console.log('cookieObj:',cookieObj);
    }catch(error){
      debug(error.stack);
    }
  })
})