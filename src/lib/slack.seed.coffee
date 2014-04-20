request = require "request"

class Slack
  constructor: (@token, @domain) ->
    @apiMode = unless @domain then true else false

  composeUrl: =>
    if @apiMode
      #retrun api url
      return "https://#{@domain}.slack.com/services/hooks/incoming-webhook?token=#{@token}"
    else
      #return web hook mode
      return "https://#{@domain}.slack.com/services/hooks/incoming-webhook?token=#{@token}"

  post: (options, callback) =>
    url = @composeUrl()

    request.post
      url: url 
      body: JSON.stringify
        channel: options.channel
        text: options.text
        username: options.username 
    , (err, body, response) ->
      callback err, response
  

module.exports = Slack 