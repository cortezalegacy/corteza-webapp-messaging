/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import unread from '@/store/unread'
import {Channel, Message} from '../../../../src/types'

const localVue = createLocalVue()
localVue.use(Vuex)

/* TODO, Not running this test because of future unread rework */

describe.skip('unread.js', () => {
  let state
  let store

  beforeEach(() => {
    state = {
      set: []
    }

    const { mutations, getters } = unread()
    store = new Vuex.Store({state, mutations, getters})
  })

  it('Can set unread info', () => {
    store.commit('set', [{channelID: '1234567890', count: 1}])
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(1)
    expect(state.set[0].channelID).to.equal('1234567890')
  })

  it('Can alter unread info', () => {
    store.commit('set', [{channelID: '1234567890', count: 2}])
    store.commit('set', [{channelID: '1234567890', count: 1}])
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(1)
    expect(state.set[0].channelID).to.equal('1234567890')
  })

  it('Can inc unread count', () => {
    store.commit('set', [{channelID: '1234567890', count: 2}])
    store.commit('inc', '1234567890')
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(3)
  })

  it('Can inc unread count multiple times', () => {
    store.commit('set', [{channelID: '1234567890', count: 2}])
    store.commit('inc', '1234567890')
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(3)
    store.commit('inc', {channelID: '1234567890'})
    expect(state.set[0].count).to.equal(4)
    store.commit('inc', {channelID: '1234567890', threadID: ''})
    expect(state.set[0].count).to.equal(5)
    store.commit('inc', new Channel({channelID:'1234567890'}))
    expect(state.set[0].count).to.equal(6)
    store.commit('inc', new Message({messageID:'12345678901',channelID:'1234567890'}))
    expect(state.set[0].count).to.equal(7)
    expect(state.set.length).to.equal(1)
  })

  it('Can dec unread count', () => {
    store.commit('set', [{channelID: '1234567890', count: 2}])
    store.commit('dec', '1234567890')
    expect(state.set.length).to.equal(1)
    expect(state.set[0].count).to.equal(1)
  })

  it('Can unset unread', () => {
    store.commit('set', [{channelID: '1234567890', count: 2}])
    store.commit('unset', '1234567890')
    expect(state.set.length).to.equal(0)
  })

  it('Can get unread count', () => {
    store.commit('set', [{channelID: '1234567890', count: 2}])
    expect(store.getters.count({channelID: '1234567890'})).to.equal(2)
    expect(store.getters.count({channelID: '1234567890', threadID: ''})).to.equal(2)
    expect(store.getters.count('1234567890')).to.equal(2)
  })

  it('Can differentiate between channel and message (thread) input', () => {
    store.commit('set', [{ channelID:'1234567890', count: 2 }])
    store.commit('set', [{ channelID:'1234567890', threadID:'9876543210', count: 2 }])
    expect(state.set.length).to.equal(2)

    store.commit('inc', new Channel({ channelID:'1234567890' }))
    store.commit('inc', new Message({ messageID:'12345678901', channelID:'1234567890', replyTo:'9876543210' }))
    store.commit('inc', new Message({ messageID:'12345678901', channelID:'1234567890', replyTo:'9876543210' }))

    expect(state.set.length).to.equal(2)
    expect(store.getters.count({channelID: '1234567890'})).to.equal(3)
    expect(store.getters.count({channelID: '1234567890', threadID: '9876543210'})).to.equal(4)
  })

  it('Can fetch ID of last read message', () => {
    store.commit('set', [{channelID: '1234567890', threadID: '', count: 2, lastMessageID: '9876543210' }])
    expect(store.getters.last({channelID: '1234567890', threadID: ''})).to.equal('9876543210')
  })
})

