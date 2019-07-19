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

  it('update from Message w/o update struct', () => {
    const m = new Message({channelID: 'c1'})
    store.dispatch('fromMessage', m)
    expect(state.set.length).to.equal(0)
  })

  it('update from Message w/ update struct', () => {
    const m = new Message({channelID: 'c1', unread: { count: 42 }})
    store.dispatch('fromMessage', m)
    expect(state.set.length).to.equal(1)
    expect(store.getters.find(m).count).to.equal(42)
  })

  it('update from Message (thread) w/ update struct', () => {
    const m = new Message({channelID: 'c1', messageID: 't1', unread: { count: 42 }})
    store.dispatch('fromMessage', m)
    expect(state.set.length).to.equal(1)
    expect(store.getters.find(m).count).to.equal(42)
    expect(store.getters.find(new Message({channelID: 'c1', messageID: 't1'})).count).to.equal(42)
    expect(store.getters.find(new Message({channelID: 'c1', messageID: 't2'})).count).to.equal(0)
  })

  it('update from Channel w/ update struct', () => {
    const c = new Channel({channelID: 'c1', unread: { count: 42 }})
    store.dispatch('fromChannel', c)
    expect(state.set.length).to.equal(1)
    expect(store.getters.find(c).count).to.equal(42)
    expect(store.getters.find(new Channel({channelID: 'c2'})).count).to.equal(0)
  })

  it('update from event', () => {
    let c = new Channel({channelID: 'c1'})
    store.dispatch('fromEvent', {channelID: c.channelID, count: 42, threadCount: 13})
    expect(state.set.length).to.equal(1)
    expect(store.getters.find(c).count).to.equal(42)
    expect(store.getters.find(c).threadCount).to.equal(13)
  })

  it('calculate total', () => {
    store.dispatch('fromEvent', {channelID: 'c1', count: 2, threadCount: 5})
    store.dispatch('fromEvent', {channelID: 'c2', count: 3, threadCount: 6})
    expect(state.set.length).to.equal(2)
    expect(store.getters.total).to.equal(2+3+5+6)

    store.dispatch('fromEvent', {channelID: 'c2', count: 3, threadCount: 7})
    expect(store.getters.total).to.equal(2+3+5+7)
  })
})

