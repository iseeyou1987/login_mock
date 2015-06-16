'use strict';

var XML = require('xml');

describe('generate xml',function(){
	it('should generate xml',function *(){
		var xml_data = [
                { object: [
                  {'int':[{_attr:{'name':'fid'}},1]},
                  {'string':[{_attr:{'name':'order'}},'receiveDate']},
                  {'string':[{_attr:{'name':'desc'}},1]},
                  {'int':[{_attr:{'name':'total'}},20]},
                  {'int':[{_attr:{'name':'start'}},0]},
                  {'string':[{_attr:{'name':'topFlag'}},'top']},
                  {'int':[{_attr:{'name':'sessionEnable'}},2]}
                  ]
                }
              ];
		xml_data = XML(xml_data,{ declaration: false });
		console.log(xml_data);
	});
})

