should = require "should"
Slack = require "../index"

domain = "slack-node"
webhookToken = "ROHgstANbsFAUA5dHHI5JONu"
apiToken = "xoxp-2307918714-2307918716-2307910813-17cabf"
webhookUri = "https://hooks.slack.com/services/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"

describe 'slack new webhook test', ->
  this.timeout(50000)
  slack = new Slack()
  slack.setWebhook(webhookUri)

  it 'should create a slack object', (done) ->
    slack.should.be.an.Object
    done()

  it 'should send a correct response', (done) ->
    
    slack.webhook
      channel: "#general"
      username: "webhookbot"
      text: "This is posted to #general and comes from a bot named webhookbot."
    , (err, response) ->
      response.should.be.ok.and.an.Object
      done()

  it 'should send a correct response with emoji', (done) ->
    slack.webhook
      channel: "#general"
      username: "webhookbot"
      text: "This is posted to #general and comes from a bot named webhookbot."
      icon_emoji: ":ghost:"
    , (err, response) ->
      response.should.be.ok.and.an.Object
      done()

  it 'should have status code and headers', (done) ->

    slack.webhook
      channel: "#general"
      username: "webhookbot"
      text: "This is posted to #general and comes from a bot named webhookbot."
      "icon_emoji": ":ghost:"
    , (err, response) ->
      response.statusCode.should.be.a.Number
      response.headers.should.be.an.Object
      done()

describe "slack api part", ->
  this.timeout 50000
  slack = new Slack apiToken
  it 'should return a slack object', (done) ->
    slack.should.be.an.Object
    done()

  it "run with user.list", (done) ->
    
    slack.api "users.list", (err, response) ->
      response.should.be.ok.and.an.Object
      done()

describe "emoji test", ->

  slack = new Slack webhookToken, domain

  it 'emoji give empty value', (done) ->
    obj = slack.detectEmoji()

    obj.should.be.an.Object
    obj["key"].should.equal("icon_emoji")
    obj["val"].should.equal("")
    done()


  it 'emoji using :ghost: style', (done) ->
    obj = slack.detectEmoji(":ghost:")

    obj.should.be.an.Object
    obj["key"].should.equal("icon_emoji")
    obj["val"].should.equal(":ghost:")
    done()

  it 'emoji using http image url', (done) ->
    obj = slack.detectEmoji("http://icons.iconarchive.com/icons/rokey/popo-emotions/128/after-boom-icon.png")

    obj.should.be.an.Object
    obj["key"].should.equal("icon_url")
    obj["val"].should.equal("http://icons.iconarchive.com/icons/rokey/popo-emotions/128/after-boom-icon.png")
    done()

describe "lack something", ->

  slack = new Slack webhookToken, domain
  it 'without callback', (done) ->
    method = "files.list"
    feedback = slack.api method
    feedback.should.be.an.Object
    feedback.should.equal(slack)
    feedback.should.not.be.null
    done()
