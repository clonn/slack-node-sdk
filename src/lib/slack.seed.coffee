request = require "request"

class Slack
  constructor: (@token, @domain) ->
    @apiMode = unless @domain then true else false
    @url = @composeUrl()

  composeUrl: =>
    return "https://slack.com/api/"

  setWebHook: (url) =>
    return @webhookUrl = url
    @

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

    payload =
      channel: options.channel
      text: options.text
      username: options.username
      attachments: options.attachments

    payload[emoji["key"]] = emoji["val"]

    request.post
      url: @webhookUrl
      body: JSON.stringify payload
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

    options = options or {}
    
    options.token = @token
    
    url = @url + method
    
    request_arg = url: @url + method
    
    if @_is_post_api(method)
      request_arg.method = "POST"
      request_arg.form = options
    else
      request_arg.method = "GET"
      request_arg.qs = options
    
    request request_arg, (err, body, response) ->
      if err
        return callback(err,
          status: "fail"
          response: response
        )

      callback err, JSON.parse(response)  if callback
      return

    return @

  _is_post_api: (method) ->
    return true  if method is "files.upload"


module.exports = Slack
