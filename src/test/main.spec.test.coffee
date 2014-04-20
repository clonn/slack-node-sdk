should = require "should"
Slack = require "../index"

domain = "slack-node"
webhookToken = "ROHgstANbsFAUA5dHHI5JONu"

describe 'slack webhook part', ->

  slack = new Slack webhookToken, domain

  it ',should send a correct response', (done) ->

    slack.should.be.an.Object
    done()

  it ',should send a correct response', (done) ->
    slack.post
      channel: "#general"
      username: "webhookbot"
      text: "This is posted to #general and comes from a bot named webhookbot."
    , (err, response) ->
      response.should.be.ok.and.a.String
      done()
