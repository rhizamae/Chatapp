var conf = require('nconf');
var fs = require('fs');
var winston = require('winston');

conf.argv().env();


 var node_env = conf.get('NODE_ENV') || 'dev';

if (node_env === 'prod' || node_env === 'production') {
    file = 'config/prod.env.json';
} else if (node_env === 'dev' || node_env === 'development') {
    file = 'config/dev.env.json';
} else {
    file = 'config/'+ node_env + 'env.json';
}
console.log(file);
try {
    fs.statSync(file);
    conf.file({ file : file });
} catch (error) {
    console.log(error);
    console.log("Unable to read configuration file: " + file);
    process.exit();
}
 

/*
//implement logging 
var logger = {};
winston.add(winston.transports.File, { filename: conf.get('app:transports:logfile') });

//log levels:
// 0 - info
// 1 - warning
// 2 - error

var levels = ['info', 'warn', 'error'];
var status = [200, 417, 500];

logger.log = function (num,message) {
	message = (new Date()).toString() + ' - ' + message;
	winston.log(levels[num], message);

	conf.set('app:status', status[num]);
	conf.set('app:message', message);
}
*/
module.exports = conf;
//module.exports.logger = logger;