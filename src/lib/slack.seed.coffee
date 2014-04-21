request = require "request"

class Slack
  constructor: (@token, @domain) ->
    @apiMode = unless @domain then true else false
    @url = @composeUrl()

  composeUrl: =>
    if @apiMode
      #retrun api url
      return "https://slack.com/api/"
    else
      #return web hook mode
      return "https://#{@domain}.slack.com/services/hooks/incoming-webhook?token=#{@token}"

  webhook: (options, callback) =>

    request.post
      url: @url 
      body: JSON.stringify
        channel: options.channel
        text: options.text
        username: options.username 
    , (err, body, response) ->
      if err or response isnt "ok"
        return callback err, null
      
      callback err, {
        ok: true
      }

  api: (method, options, callback) =>

    if typeof options is "function"
      callback = options
      options = {}

    options.token = @token

    url =  @url + method
    
    request
      url: @url + method
      method: "GET"
      qs: options
    , (err, body, response) ->
      if err
        return callback err, null

      callback err, JSON.parse(response)
      return

    return @
  

module.exports = Slack 