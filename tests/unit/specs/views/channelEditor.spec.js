/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import ChannelEditor from 'corteza-webapp-messaging/src/views/ChannelEditor'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import fp from 'flush-promises'
import sinon from 'sinon'

describe('corteza-webapp-messaging/src/views/ChannelEditor.vue', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsData, $MessagingAPI, $SystemAPI, $auth, $store
  beforeEach(() => {
    propsData = {
      channel: {
        channelID: 'ch.0001',
        members: [],
      },
    }

    $store = {
      getters: {},
    },

    $MessagingAPI = {
      statusList: sinon.stub().resolves([]),
      channelRead: sinon.stub().resolves({}),
      channelState: sinon.stub().resolves({}),
      channelCreate: sinon.stub().resolves({}),
      channelJoin: sinon.stub().resolves(),
      channelPart: sinon.stub().resolves(),
      channelUpdate: sinon.stub().resolves(),
    }

    $SystemAPI = {
      userList: sinon.stub().resolves({}),
    }

    $auth = {
      user: { userID: 'u.0001' },
    }
  })

  const mountCE = (opt) => {
    return shallowMount(ChannelEditor, {
      mocks: { $MessagingAPI, $SystemAPI, $auth, $store },
      propsData,
      ...opt,
    })
  }

  describe('ui', () => {
    it('show private channel option, if user can make private channels', () => {
      $store.getters['session/canCreatePrivateChannel'] = true
      const wrap = mountCE()

      expect(wrap.find('div.test-private-ch').exists()).to.be.true
    })

    it('hide private channel option, if user can\'t make private channels', () => {
      $store.getters['session/canCreatePrivateChannel'] = false
      const wrap = mountCE()

      expect(wrap.find('div.test-private-ch').exists()).to.be.false
    })
  })
})
