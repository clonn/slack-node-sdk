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

  detectEmoji: (emoji) =>
    obj = []

    unless emoji
      obj["key"] = "icon_emoji"
      obj["val"] = ""
      return obj

    if emoji.match(/^http/)
      obj["key"] = "icon_url"
      obj["val"] = emoji
    else
      obj["key"] = "icon_emoji"
      obj["val"] = emoji

    return obj

  webhook: (options, callback) =>

    emoji = @detectEmoji(options.icon_emoji)

    bufferJson =
      channel: options.channel
      text: options.text
      username: options.username
      attachments: options.attachments

    bufferJson[emoji["key"]] = emoji["val"]

    request.post
      url: @url
      body: JSON.stringify bufferJson
    , (err, body, response) ->

      callback err, {
        status: if err or response isnt "ok" then "fail" else "ok"
        statusCode: body.statusCode
        headers: body.headers
        response: response
      }

  api: (method, options, callback) =>

    if typeof options is "function"
      callback = options
      options = {}

    # prevent options it empty
    options = options || {}
    options.token = @token

    url =  @url + method

    request
      url: @url + method
      method: "GET"
      qs: options
    , (err, body, response) ->
      if err
        return callback err, {
          status: "fail"
          response: response
        }

      callback(err, JSON.parse(response)) if (callback) 
    
      return

    return @


module.exports = Slack
