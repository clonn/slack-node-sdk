'use strict';

var https = require('https');
var http = require('http');
var url = require('url');
var querystring = require('querystring');

var RETRYABLE_ERRORS = [
  'ECONNRESET', 'ENOTFOUND', 'ESOCKETTIMEDOUT', 'ETIMEDOUT',
  'ECONNREFUSED', 'EHOSTUNREACH', 'EPIPE', 'EAI_AGAIN', 'EBUSY'
];

function buildMultipartBody(fields, boundary) {
  var parts = [];
  var keys = Object.keys(fields);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var val = fields[key];
    parts.push(
      '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="' + key + '"\r\n\r\n' +
      val + '\r\n'
    );
  }
  parts.push('--' + boundary + '--\r\n');
  return parts.join('');
}

function makeSingleRequest(options, callback) {
  var parsed = url.parse(options.url);
  var body = null;
  var headers = {};
  var path = parsed.path;
  var done = false;

  function finish(err, httpResponse, bodyStr) {
    if (done) return;
    done = true;
    callback(err, httpResponse, bodyStr);
  }

  if (options.method === 'POST' && options.formData) {
    var boundary = '----SlackNodeSDK' + Date.now();
    body = buildMultipartBody(options.formData, boundary);
    headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary;
    headers['Content-Length'] = Buffer.byteLength(body);
  } else if (options.method === 'POST' && options.body) {
    body = options.body;
    headers['Content-Length'] = Buffer.byteLength(body);
  } else if (options.method === 'GET' && options.qs) {
    var qs = querystring.stringify(options.qs);
    if (qs) {
      path = parsed.pathname + '?' + qs;
    }
  }

  var transport = parsed.protocol === 'https:' ? https : http;
  var reqOptions = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: path,
    method: options.method || 'GET',
    headers: headers
  };

  var req = transport.request(reqOptions, function(res) {
    var chunks = [];
    res.on('data', function(chunk) {
      chunks.push(chunk);
    });
    res.on('end', function() {
      var bodyStr = Buffer.concat(chunks).toString();
      finish(null, { statusCode: res.statusCode, headers: res.headers }, bodyStr);
    });
  });

  req.on('error', function(err) {
    finish(err, null, null);
  });

  if (options.timeout) {
    req.setTimeout(options.timeout, function() {
      var err = new Error('ESOCKETTIMEDOUT');
      err.code = 'ESOCKETTIMEDOUT';
      req.destroy(err);
    });
  }

  if (body) {
    req.write(body);
  }
  req.end();
}

function makeRequest(options, callback) {
  var maxAttempts = options.maxAttempts || 1;
  var attempt = 0;

  function tryRequest() {
    attempt++;
    makeSingleRequest(options, function(err, httpResponse, body) {
      var shouldRetry = false;

      if (err && RETRYABLE_ERRORS.indexOf(err.code) !== -1) {
        shouldRetry = true;
      } else if (httpResponse && httpResponse.statusCode >= 500) {
        shouldRetry = true;
      }

      if (shouldRetry && attempt < maxAttempts) {
        setTimeout(tryRequest, 0);
        return;
      }

      callback(err, httpResponse, body);
    });
  }

  tryRequest();
}

module.exports = makeRequest;
