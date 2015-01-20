slack-node-sdk
==============

[![Build Status](https://travis-ci.org/clonn/slack-node-sdk.svg?branch=master)](https://travis-ci.org/clonn/slack-node-sdk)

[Slack](https://slack.com/) Node SDK, full support Webhook and Slack API, continuous update.

##install

    npm install slack-node

##Slack Webhook usage

At first, you have to apply [Slack webhook](https://my.slack.com/services/new/incoming-webhook).
and copy `webhook url`

### Webhook usage

code example,

    var Slack = require('slack-node');

    webhookUri = "__uri___";

    slack = new Slack();
    slack.setWebHook(webhookUri);

    slack.webhook({
      channel: "#general",
      username: "webhookbot",
      text: "This is posted to #general and comes from a bot named webhookbot."
    }, function(err, response) {
      console.log(response);
    });

Use icon emoji, you can give a Slack defined emoji, or use image from URL.


    var Slack = require('slack-node');

    webhookUri = "__uri___";

    slack = new Slack();
    slack.setWebHook(webhookUri);

    // slack emoji
    slack.webhook({
      channel: "#general",
      username: "webhookbot",
      icon_emoji: ":ghost:"
    }, function(err, response) {
      console.log(response);
    });

    // URL image
    slack.webhook({
      channel: "#general",
      username: "webhookbot",
      icon_emoji: "http://icons.iconarchive.com/icons/rokey/popo-emotions/128/after-boom-icon.png"
    }, function(err, response) {
      console.log(response);
    });

## Slack API support

first you have to apply an API from [SLACK API page](https://api.slack.com/),

 * [https://api.slack.com/](https://api.slack.com/)

The method, please referece [Slack API page](https://api.slack.com/)

example code,

    var Slack = require('slack-node');
    apiToken = "-- api token --";

    slack = new Slack(apiToken);

    slack.api("users.list", function(err, response) {
      console.log(response);
    });

    slack.api('chat.postMessage', {text:'hello from nodejs', channel:'#general'}, function(){});

## Changelog
 
 * 0.0.96
  * support ES6, promise function.
 
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
