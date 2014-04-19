request = require "request"

webhook = (domain, token) ->
  @domain = domain
  @token = token

  sendFields = (options, callback) ->
    request.post
      url: "https://#{@domain}.slack.com/services/hooks/incoming-webhook?token=#{@token}"
      body: JSON.stringify
        channel: options.channel
        text: options.text
        username: options.username 
    , (err, body, response) ->
      callback err, response

  return {
    post: sendFields
  }

module.exports.webhook = webhook