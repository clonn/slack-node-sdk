'use strict';

var request = require('./http-client');

var DEFAULT_TIMEOUT = 10 * 1000;
var DEFAULT_MAX_ATTEMPTS = 3;

function Slack(token, domain) {
  this.token = token;
  this.domain = domain;
  this.apiMode = (domain == null);
  this.url = this.composeUrl();
  this.timeout = DEFAULT_TIMEOUT;
  this.maxAttempts = DEFAULT_MAX_ATTEMPTS;
}

Slack.prototype.composeUrl = function() {
  return 'https://slack.com/api/';
};

Slack.prototype.setWebhook = function(url) {
  this.webhookUrl = url;
  return this;
};

Slack.prototype.detectEmoji = function(emoji) {
  var obj = {};
  if (!emoji) {
    obj.key = 'icon_emoji';
    obj.val = '';
    return obj;
  }
  obj.key = emoji.match(/^http/) ? 'icon_url' : 'icon_emoji';
  obj.val = emoji;
  return obj;
};

Slack.prototype._webhookRequest = function(options, callback) {
  var emoji = this.detectEmoji(options.icon_emoji);
  var payload = {
    response_type: options.response_type || 'ephemeral',
    channel: options.channel,
    text: options.text,
    username: options.username,
    attachments: options.attachments,
    link_names: options.link_names || 0
  };
  payload[emoji.key] = emoji.val;

  request({
    method: 'POST',
    url: this.webhookUrl,
    body: JSON.stringify(payload),
    timeout: this.timeout,
    maxAttempts: this.maxAttempts,
    retryDelay: 0
  }, function(err, body, response) {
    if (err) {
      return callback(err);
    }
    return callback(null, {
      status: (response !== 'ok') ? 'fail' : 'ok',
      statusCode: body.statusCode,
      headers: body.headers,
      response: response
    });
  });
};

Slack.prototype.webhook = function(options, callback) {
  if (typeof callback === 'function') {
    this._webhookRequest(options, callback);
    return this;
  }

  var self = this;
  return new Promise(function(resolve, reject) {
    self._webhookRequest(options, function(err, response) {
      if (err) return reject(err);
      resolve(response);
    });
  });
};

Slack.prototype._apiRequest = function(method, options, callback) {
  var request_arg = {
    url: this.url + method,
    timeout: this.timeout,
    maxAttempts: this.maxAttempts,
    retryDelay: 0
  };

  if (this._is_post_api(method)) {
    request_arg.method = 'POST';
    request_arg.formData = options;
  } else {
    request_arg.method = 'GET';
    request_arg.qs = options;
    request_arg.useQuerystring = true;
  }

  request(request_arg, function(err, body, response) {
    var parsedResponse;
    if (err) {
      return callback(err, { status: 'fail', response: response });
    }
    try {
      parsedResponse = JSON.parse(response);
    } catch (e) {
      return callback(new Error("Couldn't parse Slack API response as JSON:\n" + response));
    }
    callback(null, parsedResponse);
  });
};

Slack.prototype.api = function(method, options, callback) {
  if (options == null) {
    options = {};
  }
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options.token = this.token;

  if (typeof callback === 'function') {
    this._apiRequest(method, options, callback);
    return this;
  }

  var self = this;
  return new Promise(function(resolve, reject) {
    self._apiRequest(method, options, function(err, response) {
      if (err) return reject(err);
      resolve(response);
    });
  });
};

Slack.prototype._is_post_api = function(method) {
  return method === 'files.upload';
};

module.exports = Slack;
