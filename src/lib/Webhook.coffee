request = require "requestretry"

DEFAULT_TIMEOUT = 10 * 1000
DEFAULT_MAX_ATTEMPTS = 3

class Webhook

  constructor: (options = {}) ->
    @options = options
    @timeout = DEFAULT_TIMEOUT
    @maxAttempts = DEFAULT_MAX_ATTEMPTS

  @detectEmoji: (emoji) ->
    obj = {}

    unless emoji
      obj.key = "icon_emoji"
      obj.val = ""
      return obj

    obj.key = if emoji.match(/^http/) then "icon_url" else "icon_emoji"
    obj.val = emoji
    return obj

  respond: (options, callback) ->

    if typeof options is "object"
      text = options.text
    else
      text = options
      options = {}

    emoji = Webhook.detectEmoji(options.icon_emoji or @options.response_type)

    payload =
      response_type: options.response_type or @options.response_type or 'ephemeral'
      channel: options.channel or @options.channel
      text: text
      username: options.username or @options.username
      attachments: options.attachments or @options.attachments
      link_names: options.link_names or @options.link_names or 0

    payload[emoji.key] = emoji.val

    request
      method: "POST"
      url: options.url or @options.url
      body: JSON.stringify payload
      timeout: options.timeout or @timeout
      maxAttempts: options.maxAttempts or @maxAttempts
      retryDelay: 0
    , (err, body, response) ->
      if err? then return callback?(err)
      callback?(null, {
        status: if err or response isnt "ok" then "fail" else "ok"
        statusCode: body.statusCode
        headers: body.headers
        response: response
      })

module.exports = Webhook
