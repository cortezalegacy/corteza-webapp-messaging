/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import {cleanMentions} from '@/lib/mentions'
import {Channel, User} from '../../../../src/types'

describe('mentions.js', () => {
  const channels = [new Channel({ID:"12345678900", name: 'Chan'})]
  const users = [new User({ID:"12345678900", name: 'John'})]

  it('Can return text as-is if there are no mentions', () => {
    expect(cleanMentions('abcd')).to.equal('abcd')
  })

  it('It replaces user mentions with provided label', () => {
    expect(cleanMentions('prefix <@1 john doe> suffix', users, channels)).to.equal('prefix john doe suffix')
  })

  it('It replaces channel mentions with provided label prefixed with hashtag', () => {
    expect(cleanMentions('prefix <#1 chan> suffix', users, channels)).to.equal('prefix #chan suffix')
  })

  it('It replaces channel mention with channel from the list', () => {
    expect(cleanMentions('prefix <#12345678900> suffix', users, channels)).to.equal('prefix #Chan suffix')
  })

  it('It replaces user mention with person from the list', () => {
    expect(cleanMentions('prefix <@12345678900> suffix', users, channels)).to.equal('prefix John suffix')
  })

  it('It replaces more complex combo', () => {
    expect(cleanMentions('<@12345678900> on <#12345678900>', users, channels)).to.equal('John on #Chan')
  })
})

