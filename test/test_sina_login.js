
var co = require('co');
var sina = require('../mockers/sina.js');
var username = 'qeeniao_test@sina.com';
var password = 'qeeniao!QA';

describe('sina login ',function(){
  it('should get cookie',function *(){
    var res = yield sina.getCookie(username,password);
    console.log('res:',res);
  });

});
