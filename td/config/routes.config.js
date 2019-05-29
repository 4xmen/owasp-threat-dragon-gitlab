﻿'use strict';

var express = require('express');
var csrf = require('csurf');
var home = require('../controllers/homecontroller');
var gitlab = require('../controllers/gitlablogincontroller');
var threatmodel = require('../controllers/threatmodelcontroller');
var router = express.Router();

module.exports = function(app) {
    
    //anti csrf
    var csrfProtection = csrf();
    
    //main application entry point
    router.get('/', csrfProtection, home.ensureLoggedIn, home.index);
    
    //login/out
    router.get('/login', csrfProtection, home.login);
    router.get('/logoutform', csrfProtection, home.logoutform);
    router.post('/logout', csrfProtection, home.logout);

    //gitlab sign in
    router.post('/login', csrfProtection, gitlab.doLogin);
    router.get('/login/gitlab', gitlab.doLogin);
    router.get('/oauth/gitlab', gitlab.doLogin, gitlab.completeLogin);
    
    //threat models
    router.get('/threatmodel/repos', home.ensureLoggedIn, threatmodel.repos);
    router.get('/threatmodel/:organisation/:repo/branches', home.ensureLoggedIn, threatmodel.branches);
    router.get('/threatmodel/:organisation/:repo/:branch/models', home.ensureLoggedIn, threatmodel.models);
    router.get('/threatmodel/:organisation/:repo/:branch/:model/data', home.ensureLoggedIn, threatmodel.model);
    router.delete('/threatmodel/:organisation/:repo/:branch/:model', csrfProtection, home.ensureLoggedIn, threatmodel.deleteModel);
    router.put('/threatmodel/:organisation/:repo/:branch/:model/create', csrfProtection, home.ensureLoggedIn, threatmodel.create);
    router.put('/threatmodel/:organisation/:repo/:branch/:model/update', csrfProtection, home.ensureLoggedIn, threatmodel.update);
    
    app.use('/', router);
};

