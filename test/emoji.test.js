'use strict';

var should = require('should');
var Slack = require('../lib');

describe('detectEmoji()', function() {
  var slack;

  beforeEach(function() {
    slack = new Slack('test-token');
  });

  it('should return icon_emoji with empty val when no emoji given', function() {
    var obj = slack.detectEmoji();
    obj.should.be.an.Object;
    obj.key.should.equal('icon_emoji');
    obj.val.should.equal('');
  });

  it('should return icon_emoji with empty val when empty string given', function() {
    var obj = slack.detectEmoji('');
    obj.should.be.an.Object;
    obj.key.should.equal('icon_emoji');
    obj.val.should.equal('');
  });

  it('should return icon_emoji for :ghost: style emoji', function() {
    var obj = slack.detectEmoji(':ghost:');
    obj.key.should.equal('icon_emoji');
    obj.val.should.equal(':ghost:');
  });

  it('should return icon_emoji for :thumbsup: style emoji', function() {
    var obj = slack.detectEmoji(':thumbsup:');
    obj.key.should.equal('icon_emoji');
    obj.val.should.equal(':thumbsup:');
  });

  it('should return icon_url for http URL', function() {
    var url = 'http://example.com/icon.png';
    var obj = slack.detectEmoji(url);
    obj.key.should.equal('icon_url');
    obj.val.should.equal(url);
  });

  it('should return icon_url for https URL', function() {
    var url = 'https://example.com/icon.png';
    var obj = slack.detectEmoji(url);
    obj.key.should.equal('icon_url');
    obj.val.should.equal(url);
  });
});
