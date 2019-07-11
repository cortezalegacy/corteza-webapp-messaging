/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import unread from 'corteza-webapp-messaging/src/store/unread'
import {Channel, Message} from '../../../../src/types'

const localVue = createLocalVue()
localVue.use(Vuex)

/* TODO, Not running this test because of future unread rework */

describe('unread.js', () => {
  let state
  let store

  beforeEach(() => {
    state = {
      pending: false,
      set: [],
    }

    const { actions, mutations, getters } = unread()
    store = new Vuex.Store({state, actions, mutations, getters})
  })

  it('new message on an empty set', () => {
    store.dispatch('count', new Message({channelID: 'c1'}))
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(1)
    expect(state.set[0].channelID).to.equal('c1')
  })

  it('multiple new messages', () => {
    store.dispatch('count', new Message({channelID: 'c1'}))
    store.dispatch('count', new Message({channelID: 'c1'}))
    store.dispatch('count', new Message({channelID: 'c1'}))
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(3)
  })

  it('decrement on deleted message', () => {
    store.dispatch('count', new Message({channelID: 'c1'}))
    store.dispatch('count', new Message({channelID: 'c1'}))
    store.dispatch('count', new Message({channelID: 'c1', deletedAt: new Date()}))
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(1)
  })

  it('skip count on updated message', () => {
    store.dispatch('count', new Message({channelID: 'c1'}))
    store.dispatch('count', new Message({channelID: 'c1', updatedAt: new Date()}))
    store.dispatch('count', new Message({channelID: 'c1'}))
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(2)
  })

  it('update unread without the data', () => {
    store.dispatch('update', {})
    expect(state.set.length).to.equal(0)
  })

  it('update unread with simple data the data', () => {
    store.dispatch('update', new Channel({ channelID: 'c1', unread: { count: 2 }}))
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(2)
  })

  it('update unread with existing set', () => {
    store.dispatch('count', new Message({channelID: 'c1'}))
    store.dispatch('update', new Channel({ channelID: 'c1', unread: { count: 2, lastMessageID: 'lm1' }}))
    store.dispatch('count', new Message({channelID: 'c1'}))
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(3)
    expect(state.set[0].lastMessageID).to.equal('lm1')
  })

  it('complex set update', () => {
    store.dispatch('update', [
      new Channel({ channelID: 'c1', unread: { count: 10 }}),
      new Channel({ channelID: 'c2', unread: { count: 20 }}),
    ])
    store.dispatch('count', new Message({channelID: 'c1'}))
    store.dispatch('count', new Message({channelID: 'c2'}))
    store.dispatch('count', new Message({channelID: 'c2'}))

    expect(state.set.length).to.equal(2)
    expect(state.set[0].count).to.equal(11)
    expect(state.set[1].count).to.equal(22)
  })

  it('increment/decrement in-thread counter', () => {
    store.dispatch('count', new Message({channelID: 'c1'}))
    store.dispatch('count', new Message({channelID: 'c1', replyTo: 'm1'}))
    store.dispatch('count', new Message({channelID: 'c1', replyTo: 'm1'}))
    store.dispatch('count', new Message({channelID: 'c1', replyTo: 'm1', deletedAt: new Date()}))
    store.dispatch('count', new Message({channelID: 'c1', replyTo: 'm1', updatedAt: new Date()}))
    store.dispatch('count', new Message({channelID: 'c1', replyTo: 'm1'}))

    expect(state.set.length).to.equal(2)
    expect(state.set[0].count).to.equal(1)
    expect(state.set[0].tcount).to.equal(2)
    expect(state.set[1].count).to.equal(2)
  })
})

