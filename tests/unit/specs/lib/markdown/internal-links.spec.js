/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import render from 'corteza-webapp-messaging/src/lib/markdown'

let mdInput

describe('markdown.js', () => {
  beforeEach(() => {
    mdInput = (str) => expect(render(str).toHTML().trim()).to
  })

  it('It should render internal links', () => {
    mdInput('<@11111111111111>').equal('<p><user-link ID="11111111111111"></user-link></p>')
  })

  it('It should render internal links with some pre/post text', () => {
    mdInput('foo <@2222222222222> bar').equal('<p>foo <user-link ID="2222222222222"></user-link> bar</p>')
  })

  it('It should render internal links with markup', () => {
    mdInput('**<@333333>**').equal('<p><strong><user-link ID="333333"></user-link></strong></p>')
  })

  it('It should render internal links with label', () => {
    mdInput('<@333333 name>').equal('<p><user-link ID="333333" label="name"></user-link></p>')
  })

  it('It should render multiple internal links', () => {
    mdInput('one <@1> two <#2> three <@3> stop').
      equal('<p>one <user-link ID="1"></user-link> two <channel-link ID="2"></channel-link> three <user-link ID="3"></user-link> stop</p>')
  })
})
