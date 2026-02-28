slack-node-sdk
==============

[![Build Status](https://travis-ci.com/clonn/slack-node-sdk.svg?branch=master)](https://travis-ci.com/clonn/slack-node-sdk)

[Slack](https://slack.com/) Node SDK, full support for Webhook and the Slack API, continuously updated.

**Zero runtime dependencies.** Supports both **callback** and **Promise** styles. Requires Node.js 8+.

## Install

    npm install slack-node

## Slack Webhook Usage

First, apply for a [Slack Incoming Webhook](https://my.slack.com/services/new/incoming-webhook) and copy the webhook URL.

### Callback style

```javascript
var Slack = require('slack-node');

var slack = new Slack();
slack.setWebhook("__your_webhook_url__");

slack.webhook({
  channel: "#general",
  username: "webhookbot",
  text: "This is posted to #general and comes from a bot named webhookbot."
}, function(err, response) {
  console.log(response);
});
```

### Promise style

```javascript
var Slack = require('slack-node');

var slack = new Slack();
slack.setWebhook("__your_webhook_url__");

slack.webhook({
  channel: "#general",
  username: "webhookbot",
  text: "This is posted to #general and comes from a bot named webhookbot."
}).then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

### async/await

```javascript
const Slack = require('slack-node');

const slack = new Slack();
slack.setWebhook("__your_webhook_url__");

async function sendMessage() {
  const response = await slack.webhook({
    channel: "#general",
    username: "webhookbot",
    text: "Hello from async/await!"
  });
  console.log(response);
}

sendMessage();
```

### Emoji support

You can use a Slack emoji or an image URL:

```javascript
// Slack emoji
slack.webhook({
  channel: "#general",
  username: "webhookbot",
  icon_emoji: ":ghost:",
  text: "test message"
}, function(err, response) {
  console.log(response);
});

// URL image
slack.webhook({
  channel: "#general",
  username: "webhookbot",
  icon_emoji: "http://example.com/icon.png",
  text: "test message"
}, function(err, response) {
  console.log(response);
});
```

More examples in the [example](https://github.com/clonn/slack-node-sdk/tree/master/example) directory.

## Slack API Usage

First, get an API token from the [Slack API page](https://api.slack.com/).

### Callback style

```javascript
var Slack = require('slack-node');
var slack = new Slack("__your_api_token__");

slack.api("users.list", function(err, response) {
  console.log(response);
});

slack.api("chat.postMessage", {
  text: "hello from nodejs",
  channel: "#general"
}, function(err, response) {
  console.log(response);
});
```

### Promise style

```javascript
var Slack = require('slack-node');
var slack = new Slack("__your_api_token__");

slack.api("users.list").then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});

slack.api("chat.postMessage", {
  text: "hello from nodejs",
  channel: "#general"
}).then(function(response) {
  console.log(response);
});
```

### async/await

```javascript
const Slack = require('slack-node');
const slack = new Slack("__your_api_token__");

async function main() {
  const users = await slack.api("users.list");
  console.log(users);

  const result = await slack.api("chat.postMessage", {
    text: "hello from async/await",
    channel: "#general"
  });
  console.log(result);
}

main();
```

### File upload

```javascript
slack.api("files.upload", {
  channels: "#general",
  content: "file content here"
}, function(err, response) {
  console.log(response);
});
```

## How It Works

Every async method (`api`, `webhook`) supports dual-mode operation:

- **With callback:** passes `(err, response)` to the callback and returns `this` (chainable)
- **Without callback:** returns a native `Promise`

```javascript
// Callback mode — returns `this`
var ret = slack.api("users.list", function(err, response) { });
console.log(ret === slack); // true

// Promise mode — returns a Promise
var promise = slack.api("users.list");
console.log(typeof promise.then); // "function"
```

No external Promise library is needed. The SDK uses native `Promise`.

## Configuration

```javascript
var slack = new Slack("token");

// Custom timeout (default: 10000ms)
slack.timeout = 5000;

// Custom retry attempts (default: 3)
slack.maxAttempts = 5;
```

## Changelog

 * 0.3.0
  * Removed all runtime dependencies — uses only native Node.js `http`/`https` modules
  * Supports Node.js 8 through 22 with identical API
  * CI Node.js version matrix: 8, 10, 12, 14, 16, 18, 20, 22
  * Version-adaptive test dependency installation for cross-version compatibility

 * 0.2.0
  * Migrated source from CoffeeScript to ES6+ JavaScript
  * Added dual-mode support: all async methods now return a Promise when no callback is provided
  * Full backward compatibility — existing callback-based code works without changes
  * Replaced real API tests with comprehensive mock tests (37 test cases using nock)
  * Upgraded all dependencies to latest versions (requestretry 8.x, mocha 11.x, nock 14.x)
  * Minimum Node.js version raised to 18+ (all older versions are EOL)
  * CI Node.js version matrix: 18, 20, 22
  * Removed CoffeeScript build step

 * 0.1.7
  * slack-node no longer crashes if Slack returns HTML instead of JSON.

 * 0.1.6
  * support ES6, promise function.

 * 0.1.3
  * use [requestretry](https://www.npmjs.com/package/requestretry) replace request. thanks for [timjrobinson](https://github.com/clonn/slack-node-sdk/pull/11)
  * update test
  * fixed emoji error
  * fixed return error crash when run time.

 * 0.1.0
  * fixed test type error
  * support new [slack webhook](https://api.slack.com/incoming-webhooks).

 * 0.0.95
  * fixed webhook function and test
  * support file upload function

 * 0.0.93
  * return header and status

 * 0.0.92
  * merge slack emoji for webhook
  * pass request full request object

 * 0.0.9
  * pass parameters bug fixed

## License

MIT
