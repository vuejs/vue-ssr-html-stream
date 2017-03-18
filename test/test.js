const fs = require('fs')
const path = require('path')
const HTMLStream = require('../')
const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf-8')
const source = fs.readFileSync(path.join(__dirname, 'fixture.html'), 'utf-8')
const sourceStream = fs.createReadStream(path.join(__dirname, 'fixture.html'), 'utf-8')

test('should work', done => {
  const context = {
    head: '<title>hello</title>',
    styles: '<style>h1 { color: red }</style>',
    state: {
      haxorXSS: '</script>'
    }
  }

  const htmlStream = new HTMLStream({
    template,
    context
  })

  let output = ''
  sourceStream
    .pipe(htmlStream)
    .on('data', chunk => {
      output += chunk.toString()
    })
    .on('end', () => {
      expect(output.indexOf(context.head)).toBeGreaterThan(-1)
      expect(output.indexOf(context.head)).toBeGreaterThan(-1)
      expect(output.indexOf(source)).toBeGreaterThan(-1)
      expect(output.indexOf('{"haxorXSS":"\\u003C\\u002Fscript\\u003E"}')).toBeGreaterThan(-1)
      done()
    })
})
