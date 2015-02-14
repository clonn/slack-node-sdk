request = require "request"

class Slack
  constructor: (@token, @domain) ->
    @apiMode = not @domain?
    @url = @composeUrl()

  composeUrl: =>
    return "https://slack.com/api/"

  setWebhook: (url) =>
    @webhookUrl = url
    return this

  detectEmoji: (emoji) =>
    obj = {}

    unless emoji
      obj.key = "icon_emoji"
      obj.val = ""
      return obj

    obj.key = if emoji.match(/^http/) then "icon_url" else "icon_emoji"
    obj.val = emoji
    return obj

  webhook: (options, callback) =>

    emoji = @detectEmoji(options.icon_emoji)

    payload =
      channel: options.channel
      text: options.text
      username: options.username
      attachments: options.attachments

    payload[emoji.key] = emoji.val

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

  api: (method, options = {}, callback) =>

    if typeof options is "function"
      callback = options
      options = {}

    options.token = @token

    url = @url + method

    request_arg = { url: @url + method }

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

      callback?(err, JSON.parse(response))
      return

    return this

  _is_post_api: (method) ->
    method is "files.upload"

module.exports = Slack
