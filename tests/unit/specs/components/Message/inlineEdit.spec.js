/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import InlineEdit from 'corteza-webapp-messaging/src/components/Messages/Message/InlineEdit'
import MessageInput from 'corteza-webapp-messaging/src/components/MessageInput'
import fp from 'flush-promises'
import sinon from 'sinon'
import Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'

const localVue = createLocalVue()
localVue.use(Vuex)

const store = new Vuex.Store({ modules: {
  users: {
    namespaced: true,
    state: {},
    getters: {
      list: () => [],
      statuses: () => [],
      channelActivity: () => () => [],
    },
  },
  channels: {
    namespaced: true,
    state: {},
    getters: {
      list: () => [],
    },
  },
}})

describe('components/Messages/Message/InlineEdit', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsData, $MessagingAPI, $auth, mocks
  beforeEach(() => {
    propsData = {
      channel: { channelID: '0001' },
      message: { messageID: '1001', message: 'test' }
    }

    $auth = {
      user: {},
    }

    $MessagingAPI = {
      messageEdit: sinon.stub().resolves({}),
    }

    mocks = {
      $MessagingAPI,
      $auth,
      $drafts: { get: sinon.stub(), set: sinon.stub(), remove: sinon.stub() },
      $commands: { test: () => false },
      $bus: { $emit: sinon.stub() },
    }
  })

  const mountIE = (opt) => shallowMount(InlineEdit, {
    store,
    localVue,
    mocks,
    propsData,
    ...opt,
  })

  it('toggle button visibilities', () => {
    const tests = [
      {
        name: 'emoji - visible',
        qs: '.input-button.emoji-button',
        propsData: { hideEmojiButton: false },
        expected: true,
      },
      {
        name: 'emoji - hidden',
        qs: '.input-button.emoji-button',
        propsData: { hideEmojiButton: true },
        expected: false,
      },
    ]

    for (const t of tests) {
      propsData = { ...propsData, ...t.propsData }
      const wrap = mountIE()
      expect(wrap.find(t.qs).exists(), t.name).to.eq(t.expected)
    }
  })

  describe('on submit', () => {
    it('if content is empty, delete', () => {
      const wrap = mountIE()
      wrap.find(MessageInput).vm.$emit('submit')
    })

    it('editing', async () => {
      const wrap = mountIE()
      wrap.setData({ draft: { content: [{ type: 'paragraph', content: [{ type: 'text', text: 'text' }] }] } })
      wrap.find(MessageInput).vm.$emit('submit')
      await fp()

      sinon.assert.calledOnce($MessagingAPI.messageEdit)
    })
  })

  describe('drafts', () => {
    it('prep draft on load based on message beeing edited', () => {
      const wrap = mountIE()
      const e = wrap.find(MessageInput)
      expect(e.props().value).to.not.be.undefined
    })
  })

  it('prompt emoji picker', () => {
    const wrap = mountIE()
    wrap.find('.input-button.emoji-button').trigger('mousedown')

    sinon.assert.calledOnce(mocks.$bus.$emit)
  })
})
