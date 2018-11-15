/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import unread from '@/store/unread'
import {Channel, Message} from '../../../../src/types'

describe('unread.js', () => {
  it('Can set unread info', () => {
    const state = {set: []}
    unread.mutations.set(state, {channelID: '1234567890', count: 1})
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(1)
    expect(state.set[0].channelID).to.equal('1234567890')
  })

  it('Can alter unread info', () => {
    const state = {set: [{channelID: '1234567890', threadID: '', count: 2}]}
    unread.mutations.set(state, {channelID: '1234567890', count: 1})
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(1)
    expect(state.set[0].channelID).to.equal('1234567890')
  })

  it('Can inc unread count', () => {
    const state = {set: [{channelID: '1234567890', threadID: '', count: 2}]}
    unread.mutations.inc(state, '1234567890')
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(3)
  })

  it('Can inc unread count multiple times', () => {
    const state = {set: [{channelID: '1234567890', threadID: '', count: 2}]}
    unread.mutations.inc(state, '1234567890')
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(3)
    unread.mutations.inc(state, {channelID: '1234567890'})
    expect(state.set[0].count).to.equal(4)
    unread.mutations.inc(state, {channelID: '1234567890', threadID: ''})
    expect(state.set[0].count).to.equal(5)
    unread.mutations.inc(state, new Channel({ID:'1234567890'}))
    expect(state.set[0].count).to.equal(6)
    unread.mutations.inc(state, new Message({ID:'12345678901',channelID:'1234567890'}))
    expect(state.set[0].count).to.equal(7)
    expect(state.set.length).to.equal(1)
  })

  it('Can dec unread count', () => {
    const state = {set: [{channelID: '1234567890', threadID: '', count: 2}]}
    unread.mutations.dec(state, '1234567890')
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(1)
  })

  it('Can unset unread', () => {
    const state = {set: [{channelID: '1234567890', threadID: '', count: 2}]}
    unread.mutations.unset(state, '1234567890')
    expect(state.set.length).to.equal(0)
  })

  it('Can get unread count', () => {
    const state = {set: [{channelID: '1234567890', threadID: '', count: 2}]}
    expect(unread.getters.count(state)({channelID: '1234567890'})).to.equal(2)
    expect(unread.getters.count(state)({channelID: '1234567890', threadID: ''})).to.equal(2)
    expect(unread.getters.count(state)('1234567890')).to.equal(2)
  })

  it('Can differentiate between channel and message (thread) input', () => {
    const state = {set: []}
    unread.mutations.set(state, { channelID:'1234567890', count: 2 })
    unread.mutations.set(state, { channelID:'1234567890', threadID:'9876543210', count: 2 })
    expect(state.set.length).to.equal(2)

    unread.mutations.inc(state, new Channel({ ID:'1234567890' }))
    unread.mutations.inc(state, new Message({ ID:'12345678901', channelID:'1234567890', replyTo:'9876543210' }))
    unread.mutations.inc(state, new Message({ ID:'12345678901', channelID:'1234567890', replyTo:'9876543210' }))

    expect(state.set.length).to.equal(2)
    expect(unread.getters.count(state)({channelID: '1234567890'})).to.equal(3)
    expect(unread.getters.count(state)({channelID: '1234567890', threadID: '9876543210'})).to.equal(4)
  })

  it('Can fetch ID of last read message', () => {
    const state = {set: [{channelID: '1234567890', threadID: '', count: 2, lastMessageID: '9876543210' }]}
    expect(unread.getters.last(state)({channelID: '1234567890', threadID: ''})).to.equal('9876543210')
  })
})

