'use strict';

var should = require('should');
var nock = require('nock');
var Slack = require('../lib');

describe('api()', function() {
  var slack;

  beforeEach(function() {
    slack = new Slack('xoxp-test-token');
    nock.cleanAll();
    nock.disableNetConnect();
  });

  afterEach(function() {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe('callback mode', function() {
    it('should call users.list via GET', function(done) {
      nock('https://slack.com')
        .get('/api/users.list')
        .query(true)
        .reply(200, JSON.stringify({ ok: true, members: [{ id: 'U1', name: 'alice' }] }));

      slack.api('users.list', function(err, response) {
        should.not.exist(err);
        response.ok.should.equal(true);
        response.members.should.be.an.Array;
        response.members[0].name.should.equal('alice');
        done();
      });
    });

    it('should call chat.postMessage via GET with options', function(done) {
      nock('https://slack.com')
        .get('/api/chat.postMessage')
        .query(true)
        .reply(200, JSON.stringify({ ok: true, ts: '1234567890.123456' }));

      slack.api('chat.postMessage', {
        channel: '#general',
        text: 'hello'
      }, function(err, response) {
        should.not.exist(err);
        response.ok.should.equal(true);
        response.ts.should.be.a.String;
        done();
      });
    });

    it('should call files.upload via POST', function(done) {
      nock('https://slack.com')
        .post('/api/files.upload')
        .reply(200, JSON.stringify({ ok: true, file: { id: 'F1' } }));

      slack.api('files.upload', {
        channels: '#general',
        content: 'file content'
      }, function(err, response) {
        should.not.exist(err);
        response.ok.should.equal(true);
        response.file.id.should.equal('F1');
        done();
      });
    });

    it('should handle JSON parse error gracefully', function(done) {
      nock('https://slack.com')
        .get('/api/users.list')
        .query(true)
        .reply(200, '<html>Not JSON</html>');

      slack.api('users.list', function(err, response) {
        should.exist(err);
        err.message.should.containEql("Couldn't parse Slack API response");
        done();
      });
    });

    it('should handle request error', function(done) {
      nock('https://slack.com')
        .get('/api/users.list')
        .query(true)
        .replyWithError('ETIMEDOUT');

      slack.api('users.list', function(err, response) {
        should.exist(err);
        response.status.should.equal('fail');
        done();
      });
    });

    it('should return this for chaining when callback provided', function() {
      nock('https://slack.com')
        .get('/api/users.list')
        .query(true)
        .reply(200, JSON.stringify({ ok: true }));

      var result = slack.api('users.list', function() {});
      result.should.equal(slack);
    });

    it('should work with method and callback only (no options)', function(done) {
      nock('https://slack.com')
        .get('/api/auth.test')
        .query(true)
        .reply(200, JSON.stringify({ ok: true, user: 'testuser' }));

      slack.api('auth.test', function(err, response) {
        should.not.exist(err);
        response.ok.should.equal(true);
        done();
      });
    });
  });

  describe('promise mode', function() {
    it('should call users.list and resolve', function() {
      nock('https://slack.com')
        .get('/api/users.list')
        .query(true)
        .reply(200, JSON.stringify({ ok: true, members: [] }));

      return slack.api('users.list').then(function(response) {
        response.ok.should.equal(true);
        response.members.should.be.an.Array;
      });
    });

    it('should call chat.postMessage with options and resolve', function() {
      nock('https://slack.com')
        .get('/api/chat.postMessage')
        .query(true)
        .reply(200, JSON.stringify({ ok: true, ts: '111.222' }));

      return slack.api('chat.postMessage', { channel: '#general', text: 'hi' })
        .then(function(response) {
          response.ok.should.equal(true);
        });
    });

    it('should call files.upload via POST and resolve', function() {
      nock('https://slack.com')
        .post('/api/files.upload')
        .reply(200, JSON.stringify({ ok: true, file: { id: 'F2' } }));

      return slack.api('files.upload', { content: 'data' })
        .then(function(response) {
          response.ok.should.equal(true);
          response.file.id.should.equal('F2');
        });
    });

    it('should reject on JSON parse error', function() {
      nock('https://slack.com')
        .get('/api/users.list')
        .query(true)
        .reply(200, 'NOT JSON');

      return slack.api('users.list').then(function() {
        throw new Error('should not resolve');
      }, function(err) {
        err.message.should.containEql("Couldn't parse Slack API response");
      });
    });

    it('should reject on request error', function() {
      nock('https://slack.com')
        .get('/api/users.list')
        .query(true)
        .replyWithError('ECONNREFUSED');

      return slack.api('users.list').then(function() {
        throw new Error('should not resolve');
      }, function(err) {
        should.exist(err);
      });
    });

    it('should return a Promise (not this)', function() {
      nock('https://slack.com')
        .get('/api/auth.test')
        .query(true)
        .reply(200, JSON.stringify({ ok: true }));

      var result = slack.api('auth.test');
      result.should.have.property('then');
      result.should.not.equal(slack);
      return result;
    });

    it('should work with method only (no options, no callback)', function() {
      nock('https://slack.com')
        .get('/api/auth.test')
        .query(true)
        .reply(200, JSON.stringify({ ok: true }));

      return slack.api('auth.test').then(function(response) {
        response.ok.should.equal(true);
      });
    });
  });
});
