'use strict';

var should = require('should');
var nock = require('nock');
var Slack = require('../lib');

var WEBHOOK_URL = 'https://hooks.slack.com/services/T000/B000/XXXX';

describe('webhook()', function() {
  var slack;

  beforeEach(function() {
    slack = new Slack();
    slack.setWebhook(WEBHOOK_URL);
    nock.cleanAll();
  });

  afterEach(function() {
    nock.cleanAll();
  });

  describe('callback mode', function() {
    it('should send a basic message', function(done) {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX')
        .reply(200, 'ok');

      slack.webhook({
        channel: '#general',
        username: 'testbot',
        text: 'hello world'
      }, function(err, response) {
        should.not.exist(err);
        response.should.be.an.Object;
        response.status.should.equal('ok');
        response.statusCode.should.equal(200);
        response.headers.should.be.an.Object;
        response.response.should.equal('ok');
        done();
      });
    });

    it('should send message with :ghost: emoji', function(done) {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX', function(body) {
          var payload = (typeof body === 'string') ? JSON.parse(body) : body;
          payload.icon_emoji.should.equal(':ghost:');
          return true;
        })
        .reply(200, 'ok');

      slack.webhook({
        channel: '#general',
        username: 'testbot',
        text: 'hello',
        icon_emoji: ':ghost:'
      }, function(err, response) {
        should.not.exist(err);
        response.status.should.equal('ok');
        done();
      });
    });

    it('should send message with URL emoji', function(done) {
      var iconUrl = 'https://example.com/icon.png';
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX', function(body) {
          var payload = (typeof body === 'string') ? JSON.parse(body) : body;
          payload.icon_url.should.equal(iconUrl);
          return true;
        })
        .reply(200, 'ok');

      slack.webhook({
        channel: '#general',
        username: 'testbot',
        text: 'hello',
        icon_emoji: iconUrl
      }, function(err, response) {
        should.not.exist(err);
        done();
      });
    });

    it('should send message with attachments', function(done) {
      var attachments = [{ text: 'attachment1', color: '#FF0000' }];
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX', function(body) {
          var payload = (typeof body === 'string') ? JSON.parse(body) : body;
          payload.attachments.should.eql(attachments);
          return true;
        })
        .reply(200, 'ok');

      slack.webhook({
        channel: '#general',
        username: 'testbot',
        text: 'hello',
        attachments: attachments
      }, function(err, response) {
        should.not.exist(err);
        done();
      });
    });

    it('should include response_type and link_names', function(done) {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX', function(body) {
          var payload = (typeof body === 'string') ? JSON.parse(body) : body;
          payload.response_type.should.equal('in_channel');
          payload.link_names.should.equal(1);
          return true;
        })
        .reply(200, 'ok');

      slack.webhook({
        channel: '#general',
        text: 'hello',
        response_type: 'in_channel',
        link_names: 1
      }, function(err, response) {
        should.not.exist(err);
        done();
      });
    });

    it('should report fail status on non-ok response body', function(done) {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX')
        .reply(200, 'invalid_token');

      slack.webhook({
        channel: '#general',
        text: 'hello'
      }, function(err, response) {
        should.not.exist(err);
        response.status.should.equal('fail');
        response.response.should.equal('invalid_token');
        done();
      });
    });

    it('should pass error on request failure', function(done) {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX')
        .replyWithError('connection refused');

      slack.webhook({
        channel: '#general',
        text: 'hello'
      }, function(err, response) {
        should.exist(err);
        should.not.exist(response);
        done();
      });
    });

    it('should return this for chaining', function() {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX')
        .reply(200, 'ok');

      var result = slack.webhook({ text: 'hi' }, function() {});
      result.should.equal(slack);
    });
  });

  describe('promise mode', function() {
    it('should send a basic message', function() {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX')
        .reply(200, 'ok');

      return slack.webhook({
        channel: '#general',
        username: 'testbot',
        text: 'hello world'
      }).then(function(response) {
        response.should.be.an.Object;
        response.status.should.equal('ok');
        response.statusCode.should.equal(200);
        response.headers.should.be.an.Object;
      });
    });

    it('should send message with emoji', function() {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX', function(body) {
          var payload = (typeof body === 'string') ? JSON.parse(body) : body;
          payload.icon_emoji.should.equal(':robot_face:');
          return true;
        })
        .reply(200, 'ok');

      return slack.webhook({
        channel: '#general',
        text: 'hello',
        icon_emoji: ':robot_face:'
      }).then(function(response) {
        response.status.should.equal('ok');
      });
    });

    it('should reject on request failure', function() {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX')
        .replyWithError('connection refused');

      return slack.webhook({
        channel: '#general',
        text: 'hello'
      }).then(function() {
        throw new Error('should not resolve');
      }, function(err) {
        should.exist(err);
      });
    });

    it('should return a Promise (not this)', function() {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX')
        .reply(200, 'ok');

      var result = slack.webhook({ text: 'hi' });
      result.should.have.property('then');
      result.should.not.equal(slack);
      return result;
    });
  });
});
