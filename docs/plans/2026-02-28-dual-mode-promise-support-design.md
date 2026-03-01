# Slack Node SDK: Dual-mode Promise Support — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Slack Node SDK from CoffeeScript to ES6+ JavaScript with dual-mode callback+Promise support and comprehensive mock tests.

**Architecture:** Every public async method (`api`, `webhook`) auto-detects whether a callback was passed. With callback → call it and return `this`. Without callback → return a `new Promise`. Internal HTTP logic extracted to private methods `_apiRequest` and `_webhookRequest`. SDK uses only `var` and ES5/ES6 features for Node 4+ compatibility.

**Tech Stack:** Node.js 4+, requestretry, Mocha, should.js, nock

---

### Task 1: Rewrite core Slack class from CoffeeScript to ES6+ JavaScript

**Files:**
- Create: `lib/slack.js` (replaces `lib/lib/slack.seed.js`)
- Modify: `lib/index.js`

**Step 1: Write `lib/slack.js`**

This is the full rewrite. Key changes from the CoffeeScript original:
- Extract HTTP logic to `_apiRequest` and `_webhookRequest` private methods
- Add Promise return when no callback is provided
- Use only `var` for Node 4 compatibility
- Preserve all existing behavior (chaining, emoji detection, retry config)

```javascript
'use strict';

var request = require('requestretry');

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
```

**Step 2: Update `lib/index.js`**

```javascript
module.exports = require('./slack');
```

**Step 3: Verify the module loads without error**

Run: `node -e "var Slack = require('./lib'); console.log(typeof Slack);"`
Expected: `function`

**Step 4: Commit**

```bash
git add lib/slack.js lib/index.js
git commit -m "refactor: rewrite core Slack class from CoffeeScript to ES6+ JS with dual-mode callback+Promise support"
```

---

### Task 2: Update package.json, Makefile, .travis.yml, and clean up CoffeeScript artifacts

**Files:**
- Modify: `package.json`
- Modify: `.travis.yml`
- Modify: `Makefile`
- Delete: `src/` directory
- Delete: `Cakefile`
- Delete: `lib/lib/` directory (old compiled output)
- Delete: `lib/test/` directory (old compiled tests)

**Step 1: Update `package.json`**

```json
{
  "name": "slack-node",
  "version": "0.2.0",
  "description": "Slack API library for node",
  "main": "lib/index.js",
  "engines": {
    "node": ">=4.0.0"
  },
  "scripts": {
    "test": "mocha test/"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/clonn/slack-node-sdk.git"
  },
  "keywords": [
    "slack",
    "node",
    "sdk"
  ],
  "author": "Caesar Chi",
  "license": "MIT",
  "dependencies": {
    "requestretry": "^1.2.2"
  },
  "devDependencies": {
    "mocha": "^5.2.0",
    "nock": "^9.6.1",
    "should": "^13.2.3"
  }
}
```

Key changes: remove `coffee-script`, upgrade mocha/nock/should to latest Node-4-compatible versions, point test to `test/`, add `engines`, bump version to `0.2.0`.

**Step 2: Update `.travis.yml`**

```yaml
language: node_js

sudo: false

node_js:
  - "4"
  - "6"
  - "8"
  - "10"
  - "12"
  - "14"
  - "16"
  - "18"

install:
  - npm install

script: npm test
```

**Step 3: Update `Makefile`**

```makefile
.PHONY: clean install test

clean:
	rm -rf node_modules

install:
	npm install

test:
	./node_modules/.bin/mocha test/
```

Remove the `compile` target entirely.

**Step 4: Delete CoffeeScript artifacts**

```bash
rm -rf src/
rm -f Cakefile
rm -rf lib/lib/
rm -rf lib/test/
```

**Step 5: Verify structure**

Run: `ls lib/`
Expected: `index.js  slack.js`

Run: `node -e "var Slack = require('./lib'); console.log(typeof Slack);"`
Expected: `function`

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove CoffeeScript, update package.json, simplify build pipeline"
```

---

### Task 3: Write emoji unit tests

**Files:**
- Create: `test/emoji.test.js`

**Step 1: Write the tests**

```javascript
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
    obj.should.be.an.Object();
    obj.key.should.equal('icon_emoji');
    obj.val.should.equal('');
  });

  it('should return icon_emoji with empty val when empty string given', function() {
    var obj = slack.detectEmoji('');
    obj.should.be.an.Object();
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
```

**Step 2: Run tests to verify they pass**

Run: `npx mocha test/emoji.test.js`
Expected: 6 passing

**Step 3: Commit**

```bash
git add test/emoji.test.js
git commit -m "test: add emoji detection unit tests"
```

---

### Task 4: Write webhook mock tests (callback + promise)

**Files:**
- Create: `test/webhook.test.js`

**Step 1: Write the tests**

```javascript
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
        response.should.be.an.Object();
        response.status.should.equal('ok');
        response.statusCode.should.equal(200);
        response.headers.should.be.an.Object();
        response.response.should.equal('ok');
        done();
      });
    });

    it('should send message with :ghost: emoji', function(done) {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX', function(body) {
          var payload = JSON.parse(body);
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
          var payload = JSON.parse(body);
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
          var payload = JSON.parse(body);
          payload.attachments.should.deepEqual(attachments);
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
          var payload = JSON.parse(body);
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
        response.should.be.an.Object();
        response.status.should.equal('ok');
        response.statusCode.should.equal(200);
        response.headers.should.be.an.Object();
      });
    });

    it('should send message with emoji', function() {
      nock('https://hooks.slack.com')
        .post('/services/T000/B000/XXXX', function(body) {
          var payload = JSON.parse(body);
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
```

**Step 2: Run tests**

Run: `npx mocha test/webhook.test.js`
Expected: all passing

**Step 3: Commit**

```bash
git add test/webhook.test.js
git commit -m "test: add webhook mock tests for callback and promise modes"
```

---

### Task 5: Write API mock tests (callback + promise)

**Files:**
- Create: `test/api.test.js`

**Step 1: Write the tests**

```javascript
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
        response.members.should.be.an.Array();
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
        response.ts.should.be.a.String();
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
        response.members.should.be.an.Array();
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
```

**Step 2: Run tests**

Run: `npx mocha test/api.test.js`
Expected: all passing

**Step 3: Commit**

```bash
git add test/api.test.js
git commit -m "test: add API mock tests for callback and promise modes"
```

---

### Task 6: Write retry mock tests (callback + promise)

**Files:**
- Create: `test/retry.test.js`

**Step 1: Write the tests**

```javascript
'use strict';

var should = require('should');
var nock = require('nock');
var url = require('url');
var Slack = require('../lib');

var WEBHOOK_URL = 'https://hooks.slack.com/services/T000/B000/XXXX';

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
        .socketDelay(20)
        .reply(204, '');

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
        .socketDelay(20)
        .reply(204, '');

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
        .socketDelay(20)
        .reply(200, JSON.stringify({ ok: true }));

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
        .socketDelay(20)
        .reply(200, JSON.stringify({ ok: true }));

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
        .socketDelay(20)
        .reply(204, '');

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
```

**Step 2: Run tests**

Run: `npx mocha test/retry.test.js --timeout 30000`
Expected: all passing

**Step 3: Commit**

```bash
git add test/retry.test.js
git commit -m "test: add retry behavior mock tests for callback and promise modes"
```

---

### Task 7: Run full test suite and verify everything works

**Files:** None (verification only)

**Step 1: Install dependencies**

Run: `npm install`
Expected: clean install, no errors

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass (emoji: 6, webhook: ~12, api: ~14, retry: ~5)

**Step 3: Verify module loads correctly**

Run: `node -e "var Slack = require('./lib'); var s = new Slack('tok'); console.log(typeof s.api, typeof s.webhook, typeof s.detectEmoji);"`
Expected: `function function function`

**Step 4: Verify callback backward compatibility**

Run:
```bash
node -e "
var nock = require('nock');
nock('https://slack.com').get('/api/auth.test').query(true).reply(200, JSON.stringify({ok:true}));
var Slack = require('./lib');
var s = new Slack('tok');
s.api('auth.test', function(err, r) { console.log('callback works:', r.ok); });
"
```
Expected: `callback works: true`

**Step 5: Verify promise mode**

Run:
```bash
node -e "
var nock = require('nock');
nock('https://slack.com').get('/api/auth.test').query(true).reply(200, JSON.stringify({ok:true}));
var Slack = require('./lib');
var s = new Slack('tok');
s.api('auth.test').then(function(r) { console.log('promise works:', r.ok); });
"
```
Expected: `promise works: true`

**Step 6: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "chore: final verification pass"
```

---

### Task 8: Clean up old files and create final commit

**Files:** Verify no stale files remain

**Step 1: Verify no CoffeeScript files remain in lib/**

Run: `find . -name '*.coffee' -not -path './node_modules/*'`
Expected: Only files in `src/` if it still exists (it should have been deleted in Task 2). If any remain, delete them.

**Step 2: Verify final directory structure**

Run: `find . -not -path './node_modules/*' -not -path './.git/*' -type f | sort`

Expected structure:
```
./.gitignore
./.travis.yml
./LICENSE
./Makefile
./README.md
./docs/plans/2026-02-28-dual-mode-promise-support-design.md
./example/api.postMessage.js
./example/emoji.js
./example/webhook.js
./lib/index.js
./lib/slack.js
./package.json
./test/api.test.js
./test/emoji.test.js
./test/retry.test.js
./test/webhook.test.js
```

**Step 3: Run tests one final time**

Run: `npm test`
Expected: All tests pass

**Step 4: Tag the release**

```bash
git tag v0.2.0
```
