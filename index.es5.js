var Transform = require('stream').Transform
var serialize = require('serialize-javascript')

var HTMLStream = (function (Transform) {
  function HTMLStream (options) {
    Transform.call(this)
    this.started = false
    var template = parseTemplate(options.template, options.outletPlaceholder)
    this.head = template.head
    this.neck = template.neck
    this.tail = template.tail
    this.context = options.context || {}
  }

  if ( Transform ) HTMLStream.__proto__ = Transform;
  HTMLStream.prototype = Object.create( Transform && Transform.prototype );
  HTMLStream.prototype.constructor = HTMLStream;

  HTMLStream.prototype._transform = function _transform (data, encoding, done) {
    if (!this.started) {
      this.emit('beforeStart')
      this.started = true
      this.push(this.head)
      // inline server-rendered head meta information
      if (this.context.head) {
        this.push(this.context.head)
      }
      // inline server-rendered CSS collected by vue-style-loader
      if (this.context.styles) {
        this.push(this.context.styles)
      }
      this.push(this.neck)
    }
    this.push(data)
    done()
  };

  HTMLStream.prototype._flush = function _flush (done) {
    this.emit('beforeEnd')
    // inline initial store state
    if (this.context.state) {
      this.push(renderState(this.context.state))
    }
    this.push(this.tail)
    done()
  };

  return HTMLStream;
}(Transform));

function parseTemplate (template, contentPlaceholder) {
  if ( contentPlaceholder === void 0 ) contentPlaceholder = '<!--vue-ssr-outlet-->';

  if (typeof template === 'object') {
    return template
  }

  var i = template.indexOf('</head>')
  var j = template.indexOf(contentPlaceholder)

  if (j < 0) {
    throw new Error("Content placeholder not found in template.")
  }

  if (i < 0) {
    i = template.indexOf('<body>')
    if (i < 0) {
      i = j
    }
  }

  return {
    head: template.slice(0, i),
    neck: template.slice(i, j),
    tail: template.slice(j + contentPlaceholder.length)
  }
}

function renderTemplate (parsedTemplate, content, context) {
  if ( context === void 0 ) context = {};

  return (
    parsedTemplate.head +
    (context.head || '') +
    (context.styles || '') +
    parsedTemplate.neck +
    content +
    (context.state ? renderState(context.state) : '') +
    parsedTemplate.tail
  )
}

function renderState (state) {
  return ("<script>window.__INITIAL_STATE__=" + (serialize(state, { isJSON: true })) + "</script>")
}

HTMLStream.parseTemplate = parseTemplate
HTMLStream.renderTemplate = renderTemplate

module.exports = HTMLStream

