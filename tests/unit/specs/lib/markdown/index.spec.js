/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import render from '@/lib/markdown'

let mdInput

describe('index.js', () => {
  beforeEach(() => {
    mdInput = (str) => expect(render(str).toHTML().trim()).to
  })

  it('Simple bold', () => {
    mdInput('pre**bold**post').equal('<p>pre<strong>bold</strong>post</p>')
  })

  it('Simple code', () => {
    mdInput('`code`').equal('<p><code>code</code></p>')
  })

  it('Simple codeblock', () => {
    mdInput('```\ncode\n```').equal('<pre><code>code\n</code></pre>')
  })

  it('Simple code block - html escaped', () => {
    mdInput('```\n<h1>hello</h1>\n```').equal('<pre><code>&lt;h1&gt;hello&lt;/h1&gt;\n</code></pre>')
  })

  it('Simple JS codeblock', () => {
    mdInput('``` js\ncode\n```').equal('<pre><code class="language-js">code\n</code></pre>')
  })

  it('Simple JS codeblock - html escaped', () => {
    mdInput('``` js\ncode <p>here</p>\n```').equal('<pre><code class="language-js">code &lt;p&gt;here&lt;/p&gt;\n</code></pre>')
  })

  it('Complex JS codeblock', () => {
    const expected = `<span class="hljs-keyword">let</span> x = <span class="hljs-number">10</span>;\n<span class="hljs-keyword">let</span> y = x * x;\n<span class="hljs-built_in">console</span>.error(y);\n`
    mdInput('``` js\nlet x = 10;\nlet y = x * x;\nconsole.error(y);\n```').equal(`<pre><code class="language-js">${expected}</code></pre>`)
  })

  it('Multiple empty lines', () => {
    mdInput('line1\n\nline2').equal('<p>line1</p>\n<p>line2</p>')
  })

  it('Multiple empty lines in a codeblck', () => {
    mdInput('``` js\ncode\n\nmore code...\n\n\n```').equal('<pre><code class="language-js">code\n\nmore code...\n\n\n</code></pre>')
  })
})

