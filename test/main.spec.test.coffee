should = require "should"
slack = require "../index"

domain = ""
describe 'slack webhook part', ->
  doamin = "slack-node"
  webhookToken = "ROHgstANbsFAUA5dHHI5JONu"

  slackWebhook = slack.webhook
    domain: domain
    token: webhookToken

  it ',should send a correct response', ->

    slackWebhook.should.be.an.Object
    done()

  it ',should send a correct response', ->
    slackWebhook.post
      channel: "#general"
      username: "webhookbot"
      text: "This is posted to #general and comes from a bot named webhookbot."
    , (err, response) ->
      response.should.be.an.Object
      done()
