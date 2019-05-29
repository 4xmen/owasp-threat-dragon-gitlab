'use strict';

require('jasmine');
var mockery = require('mockery');
var moduleUnderTest = '../../td/controllers/gitlablogincontroller';

//request/response mocks
var mockRequest;
var mockResponse;
var next = jasmine.createSpy('next');
mockery.registerAllowable(moduleUnderTest);

//passport mocks
var mockPassport = {
    authenticate: function() { 
        return function() { };
    }
};

//crypto mocks
var mockBuffer = 'test buffer';
var mockCrypto = {
    randomBytes: function(length, cb) {
        cb(null, mockBuffer);
    },
};

describe('gitlablogincontroller tests', function() {

    beforeEach(function() {
        mockery.enable({useCleanCache: true});
        mockery.warnOnReplace(false);
        mockery.warnOnUnregistered(false);
        mockery.registerMock('passport', mockPassport);
        mockery.registerMock('crypto', mockCrypto);   
        
        mockRequest = {
            session: {},
            log: {
                error: function() {},
                info: function() {}
            }
        }
        
        mockResponse = {
            status: function() { return mockResponse;},
            send: function() {},
            redirect: function() {}
        }
        
    });
    
    afterEach(function() {
        mockery.disable();
    });
    
    afterAll(function() {
        mockery.deregisterAll();  
    });
    
    it('should set the gitlab oauth state', function() {    
        spyOn(mockPassport, 'authenticate').and.callThrough();
        var gitlabLoginController = require(moduleUnderTest);
        gitlabLoginController.doLogin(mockRequest, mockResponse, next);
        expect(mockPassport.authenticate.calls.argsFor(0)[1].state).toEqual(mockBuffer);
    });
    
    it('should not set the gitlab oauth state', function() {
        spyOn(mockPassport, 'authenticate').and.callThrough();
        var gitlabLoginController = require(moduleUnderTest);
        mockRequest.session.gitlabOauthState = {};
        gitlabLoginController.doLogin(mockRequest, mockResponse, next);
        expect(mockPassport.authenticate.calls.argsFor(0)[1]).not.toBeDefined();         
    });
    
    it('should log an error for invalid oauth state', function() {
        mockRequest.session.gitlabOauthState = 'original state';
        mockRequest.query = {state: 'incoming state'};
        spyOn(mockRequest.log, 'error');
        spyOn(mockResponse, 'status').and.callThrough();
        spyOn(mockResponse, 'send');
        var gitlabLoginController = require(moduleUnderTest);
        gitlabLoginController.completeLogin(mockRequest, mockResponse);
        expect(mockRequest.log.error.calls.argsFor(0)[0].security).toBe(true);
        expect(mockRequest.log.error.calls.argsFor(0)[0].idp).toEqual('gitlab');
        expect(mockResponse.status.calls.argsFor(0)).toEqual([400]);
        expect(mockResponse.send).toHaveBeenCalled();
    });
    
    it('should log an error for missing oauth state', function() {
        mockRequest.session.gitlabOauthState = 'original state';
        mockRequest.query = {};
        spyOn(mockRequest.log, 'error');
        spyOn(mockResponse, 'status').and.callThrough();
        spyOn(mockResponse, 'send');
        var gitlabLoginController = require(moduleUnderTest);
        gitlabLoginController.completeLogin(mockRequest, mockResponse);
        expect(mockRequest.log.error.calls.argsFor(0)[0].security).toBe(true);
        expect(mockRequest.log.error.calls.argsFor(0)[0].idp).toEqual('gitlab');
        expect(mockResponse.status.calls.argsFor(0)).toEqual([400]);
        expect(mockResponse.send).toHaveBeenCalled();
    });
    
    it('should log successful login', function() {
        mockRequest.session.gitlabOauthState = 'state';
        mockRequest.query = {state: 'state'};
        var userName = 'test user name';
        var idp = 'test idp';
        mockRequest.user = {profile: {username: userName, provider: idp}};
        spyOn(mockRequest.log, 'info');
        spyOn(mockRequest.log, 'error');
        var gitlabLoginController = require(moduleUnderTest);
        gitlabLoginController.completeLogin(mockRequest, mockResponse);
        expect(mockRequest.log.info.calls.argsFor(0)[0].security).toBe(true);
        expect(mockRequest.log.info.calls.argsFor(0)[0].idp).toEqual(idp);
        expect(mockRequest.log.info.calls.argsFor(0)[0].userName).toEqual(userName);
        expect(mockRequest.log.error).not.toHaveBeenCalled();
    });

    it('should redirect to the default route', function() {
        mockRequest.session.gitlabOauthState = 'state';
        mockRequest.query = {state: 'state'};
        var userName = 'test user name';
        var idp = 'test idp';
        mockRequest.user = {profile: {}};
        spyOn(mockResponse, 'redirect');
        var gitlabLoginController = require(moduleUnderTest);
        gitlabLoginController.completeLogin(mockRequest, mockResponse);
        expect(mockResponse.redirect.calls.argsFor(0)).toEqual(['/']);
    });
    
    it('should redirect to the specified route', function() {
        mockRequest.session.gitlabOauthState = 'state';
        var returnTo = 'return to';
        mockRequest.session.returnTo = returnTo;
        mockRequest.query = {state: 'state'};
        var userName = 'test user name';
        var idp = 'test idp';
        mockRequest.user = {profile: {}};
        spyOn(mockResponse, 'redirect');
        var gitlabLoginController = require(moduleUnderTest);
        gitlabLoginController.completeLogin(mockRequest, mockResponse);
        expect(mockResponse.redirect.calls.argsFor(0)).toEqual([returnTo]);
    });
   
    it('should clear the return to and oauth state session values', function() {
        mockRequest.session.gitlabOauthState = 'state';
        var returnTo = 'return to';
        mockRequest.session.returnTo = returnTo;
        mockRequest.query = {state: 'state'};
        var userName = 'test user name';
        var idp = 'test idp';
        mockRequest.user = {profile: {}};
        var gitlabLoginController = require(moduleUnderTest);
        gitlabLoginController.completeLogin(mockRequest, mockResponse);
        expect(mockRequest.session.returnTo).not.toBeDefined();
        expect(mockRequest.session.gitlabOauthState).not.toBeDefined();
    });
});