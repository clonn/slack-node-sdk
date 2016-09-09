var Slack = require('../lib');

var webhookUri = "__uri___";

var webhook = new Slack.Webhook({
  url: webhookUri,
  channel: "#general",
  username: "webhookbot",
});

// only text
webhook.respond("This is posted to #general and comes from a bot named webhookbot.", function(err, response) {
  console.log(response)
});

// slack emoji
webhook.respond({
  icon_emoji: ":ghost:",
  text: "test message, test message"
}, function(err, response) {
  console.log(response);
});

// URL image
webhook.respond({
  icon_emoji: "http://icons.iconarchive.com/icons/rokey/popo-emotions/128/after-boom-icon.png",
  text: "test message, test message"
}, function(err, response) {
  console.log(response);
});
