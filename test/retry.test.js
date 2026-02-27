'use strict';

var should = require('should');
var nock = require('nock');
var url = require('url');
var Slack = require('../lib');

var WEBHOOK_URL = 'https://hooks.slack.com/services/T000/B000/XXXX';
var TIMEOUT_ERROR = {code: 'ESOCKETTIMEDOUT', message: 'Socket timed out'};

describe('retry behavior', function() {
  var slack;

  beforeEach(function() {
    slack = new Slack();
    slack.setWebhook(WEBHOOK_URL);
    slack.timeout = 10;
    nock.cleanAll();
  });

  afterEach(function() {
    nock.cleanAll();
  });

  describe('webhook retry - callback', function() {
    it('should retry 3 times on timeout then return error', function(done) {
      this.timeout(30000);
      var webhookDetails = url.parse(WEBHOOK_URL);
      var mock = nock(webhookDetails.protocol + '//' + webhookDetails.host)
        .post(webhookDetails.path)
        .times(3)
        .replyWithError(TIMEOUT_ERROR);

      slack.webhook({
        channel: '#general',
        username: 'testbot',
        text: 'timeout test'
      }, function(err, response) {
        should.exist(err);
        should.not.exist(response);
        should.equal(mock.isDone(), true);
        done();
      });
    });
  });

  describe('webhook retry - promise', function() {
    it('should retry 3 times on timeout then reject', function() {
      this.timeout(30000);
      var webhookDetails = url.parse(WEBHOOK_URL);
      var mock = nock(webhookDetails.protocol + '//' + webhookDetails.host)
        .post(webhookDetails.path)
        .times(3)
        .replyWithError(TIMEOUT_ERROR);

      return slack.webhook({
        channel: '#general',
        username: 'testbot',
        text: 'timeout test'
      }).then(function() {
        throw new Error('should not resolve');
      }, function(err) {
        should.exist(err);
        should.equal(mock.isDone(), true);
      });
    });
  });

  describe('api retry - callback', function() {
    it('should retry on timeout then return error', function(done) {
      this.timeout(30000);
      slack = new Slack('xoxp-test');
      slack.timeout = 10;

      var mock = nock('https://slack.com')
        .get('/api/users.list')
        .query(true)
        .times(3)
        .replyWithError(TIMEOUT_ERROR);

      slack.api('users.list', function(err, response) {
        should.exist(err);
        should.equal(mock.isDone(), true);
        done();
      });
    });
  });

  describe('api retry - promise', function() {
    it('should retry on timeout then reject', function() {
      this.timeout(30000);
      slack = new Slack('xoxp-test');
      slack.timeout = 10;

      var mock = nock('https://slack.com')
        .get('/api/users.list')
        .query(true)
        .times(3)
        .replyWithError(TIMEOUT_ERROR);

      return slack.api('users.list').then(function() {
        throw new Error('should not resolve');
      }, function(err) {
        should.exist(err);
        should.equal(mock.isDone(), true);
      });
    });
  });

  describe('custom maxAttempts', function() {
    it('should respect custom maxAttempts setting', function(done) {
      this.timeout(30000);
      slack.maxAttempts = 2;
      var webhookDetails = url.parse(WEBHOOK_URL);
      var mock = nock(webhookDetails.protocol + '//' + webhookDetails.host)
        .post(webhookDetails.path)
        .times(2)
        .replyWithError(TIMEOUT_ERROR);

      slack.webhook({
        channel: '#general',
        text: 'test'
      }, function(err) {
        should.exist(err);
        should.equal(mock.isDone(), true);
        done();
      });
    });
  });
});
