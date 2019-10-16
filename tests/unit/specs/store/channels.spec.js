/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import channels from 'corteza-webapp-messaging/src/store/channels'
import { Channel } from '../../../../src/types'

const localVue = createLocalVue()
localVue.use(Vuex)
const myID = '333'

describe('channels.js', () => {
  let state
  let store

  beforeEach(() => {
    state = {
      pending: false,
      list: [],
    }

    const { actions, mutations, getters } = channels()
    store = new Vuex.Store({ state, actions, mutations, getters })
  })

  describe ('channelPart', () => {
    let testC = new Channel({
      channelID: '111',
      members: [ '222', '333' ]
    })

    beforeEach(() => {
      state.list = [
        testC
      ]
    })

    it('do nothing if channel not found', () => {
      testC.type = 'public'
      store.commit('channelPart', { channelID: '999', userID: '222' })

      expect(state.list).to.have.length(1)
      expect(state.list[0].members).to.have.length(2)
    })

    it('remove member from members', () => {
      testC.type = 'public'
      store.commit('channelPart', { channelID: '111', userID: '222' })

      expect(state.list).to.have.length(1)
      expect(state.list[0].members).to.have.length(1)
    })

    it('don\'t remove non-public channel, if parted user is not current user', () => {
      testC.type = 'private'
      store.commit('channelPart', { channelID: '111', userID: '222', cUser: { userID: myID } })

      expect(state.list).to.have.length(1)
      expect(state.list[0].members).to.have.length(1)
    })

    it('remove channel if channel is private and if parted user is current user', () => {
      testC.type = 'private'
      store.commit('channelPart', { channelID: '111', userID: '333', cUser: { userID: myID } })

      expect(state.list).to.have.length(0)
    })
  })
})
