should = require "should"
Slack = require "../index"

domain = "slack-node"
webhookToken = "ROHgstANbsFAUA5dHHI5JONu"
apiToken = "xoxp-2307918714-2307918716-2307910813-17cabf"

describe 'slack webhook part', ->

  slack = new Slack webhookToken, domain

  it ',should send a correct response', (done) ->

    slack.should.be.an.Object
    done()

  it ',should send a correct response', (done) ->
    slack.webhook
      channel: "#general"
      username: "webhookbot"
      text: "This is posted to #general and comes from a bot named webhookbot."
    , (err, response) ->
      response.should.be.ok.and.an.Object
      done()

describe "slack api part", ->

  slack = new Slack apiToken
  it ',shoule be return a slack object', (done) ->
    slack.should.be.an.Object
    done()

  it ", run with user.list", (done) ->
    
    slack.api "users.list", (err, response) ->
      response.should.be.ok.and.an.Object
      done()

