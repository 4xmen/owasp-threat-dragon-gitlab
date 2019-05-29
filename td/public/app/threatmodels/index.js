var app = require('angular').module('app');
var gitlab = require('./gitlab');
app.controller('gitlab', ['$q', '$routeParams', '$location', 'common', 'datacontext', gitlab]);
