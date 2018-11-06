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

  it('Simple JS codeblock', () => {
    mdInput('``` js\ncode\n```').equal('<pre><code class="language-js">code\n</code></pre>')
  })

})

