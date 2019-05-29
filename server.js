#!/usr/bin/env node
var debug = require('debug')('OWASP Threat Dragon');
var app = require('./td/app');

app.set('port', process.env.PORT || 3000);

if (process.env.GITLAB_SERVER_KEY && process.env.GITLAB_SERVER_CERT )
{
	var https = require('https');
	var fs = require('fs');
	var privateKey  = fs.readFileSync(process.env.GITLAB_SERVER_KEY, 'utf8');
	var certificate = fs.readFileSync(process.env.GITLAB_SERVER_CERT, 'utf8');

	var credentials = {key: privateKey, cert: certificate};
	var httpsServer = https.createServer(credentials, app);
	var server = httpsServer.listen(app.get('port'), function() {
		debug('Express server listening on port ' + app.get('port'));
	});
} else {
	var server = app.listen(app.get('port'), function() {
		debug('Express server listening on port ' + server.address().port);
	});
}
