/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import Footer from 'corteza-webapp-messaging/src/components/Chat/Footer'
import MessageInput from 'corteza-webapp-messaging/src/components/MessageInput'
import { Channel } from 'corteza-webapp-messaging/src/types/channel'
import fp from 'flush-promises'
import sinon from 'sinon'
import Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('components/Chat/Footer/Footer', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsData, $MessagingAPI, $auth, mocks, store, $commands
  beforeEach(() => {
    propsData = {
      channel: { channelID: '0001' },
    }

    $auth = {
      user: {},
    }

    $MessagingAPI = {
      activitySend: sinon.stub().resolves({}),
      messageReplyCreate: sinon.stub().resolves({}),
      messageCreate: sinon.stub().resolves({}),
    }

    $commands = {
      test: sinon.stub().returns(false),
      exec: sinon.stub().resolves(),
    }

    mocks = {
      $MessagingAPI,
      $auth,
      $drafts: { get: sinon.stub(), set: sinon.stub(), remove: sinon.stub() },
      $commands,
      $bus: { $emit: sinon.stub() },
    }

    store = new Vuex.Store({ modules: {
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
  })

  const mountFooter = (opt) => shallowMount(Footer, {
    store,
    localVue,
    mocks,
    propsData,
    ...opt,
  })

  it('toggle button visibilities', () => {
    sinon.stub(Footer, 'watch').get(() => {})

    const tests = [
      {
        name: 'upload - visible',
        qs: '.input-button.upload-button',
        propsData: { hideUpload: false },
        expected: true,
      },
      {
        name: 'upload - hidden',
        qs: '.input-button.upload-button',
        propsData: { hideUpload: true },
        expected: false,
      },

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

      {
        name: 'camera - visible',
        qs: '.input-button.camera-button',
        propsData: { showCameraSource: true },
        expected: true,
      },
      {
        name: 'camera - hidden',
        qs: '.input-button.camera-button',
        propsData: { showCameraSource: false },
        expected: false,
      },

      {
        name: 'gallery - visible',
        qs: '.input-button.gallery-button',
        propsData: { showGallerySource: true },
        expected: true,
      },
      {
        name: 'gallery - hidden',
        qs: '.input-button.gallery-button',
        propsData: { showGallerySource: false },
        expected: false,
      },
    ]

    for (const t of tests) {
      propsData = { ...propsData, ...t.propsData }
      const wrap = mountFooter()
      expect(wrap.find(t.qs).exists(), t.name).to.eq(t.expected)
    }
  })

  describe('on submit', () => {
    beforeEach(() => {
      sinon.stub(Footer, 'watch').get(() => {})
    })

    it('if content is empty, prevent', () => {
      const wrap = mountFooter()
      wrap.find(MessageInput).vm.$emit('submit')
      sinon.assert.notCalled($MessagingAPI.messageReplyCreate)
      sinon.assert.notCalled($MessagingAPI.messageCreate)
    })

    it('empty message - cancel', () => {
      const wrap = mountFooter()
      wrap.setData({ draft: { content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } })

      wrap.find(MessageInput).vm.$emit('submit')
      sinon.assert.notCalled($MessagingAPI.messageReplyCreate)
      sinon.assert.notCalled($MessagingAPI.messageCreate)
    })

    it('replying', async () => {
      propsData.replyTo = { messageID: '0001' }
      const wrap = mountFooter()
      wrap.setData({ draft: { content: [{ type: 'paragraph', content: [{ type: 'text', text: 'text' }] }] } })
      wrap.find(MessageInput).vm.$emit('submit')
      await fp()

      sinon.assert.calledOnce($MessagingAPI.messageReplyCreate)
    })

    it('creating', async () => {
      const wrap = mountFooter()
      wrap.setData({ draft: { content: [{ type: 'paragraph', content: [{ type: 'text', text: 'text' }] }] } })
      wrap.find(MessageInput).vm.$emit('submit')
      await fp()

      sinon.assert.calledOnce($MessagingAPI.messageCreate)
    })

    it('exec command', async () => {
      $commands.test = sinon.stub().returns(true)
      const wrap = mountFooter()
      wrap.setData({ draft: { content: [{ type: 'paragraph', content: [{ type: 'text', text: 'cmd' }] }] } })
      wrap.find(MessageInput).vm.$emit('submit')
      await fp()

      sinon.assert.calledOnce($commands.exec)
      const args = $commands.exec.args.pop()
      expect(args).to.include('cmd')
    })
  })

  describe('send activity', () => {
    it('thread activity', () => {
      propsData.replyTo = { messageID: '0001' }
      const wrap = mountFooter()
      wrap.vm.sendActivity(false)

      sinon.assert.calledOnce($MessagingAPI.activitySend)
    })

    it('channel activity', () => {
      const wrap = mountFooter()
      wrap.vm.sendActivity(false)

      sinon.assert.calledOnce($MessagingAPI.activitySend)
    })

    it('don\'t emit if content is empty', () => {
      const wrap = mountFooter()
      wrap.vm.sendActivity(true)

      sinon.assert.notCalled($MessagingAPI.activitySend)
    })
  })

  describe('drafts', () => {
    it('flush & load draft on channel change', () => {
      const wrap = mountFooter()
      wrap.setData({ draft: { content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } })
      sinon.assert.calledOnce(mocks.$drafts.get)
      sinon.assert.notCalled(mocks.$drafts.set)
      sinon.assert.notCalled(mocks.$drafts.remove)

      wrap.setProps({ channel: { channelID: '0002' } })
      sinon.assert.calledTwice(mocks.$drafts.get)
      sinon.assert.calledOnce(mocks.$drafts.set)
    })

    it('flush & load draft on reply to change', () => {
      propsData.replyTo = { messageID: '1001' }
      const wrap = mountFooter()
      wrap.setData({ draft: { content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } })
      sinon.assert.calledOnce(mocks.$drafts.get)
      sinon.assert.notCalled(mocks.$drafts.set)
      sinon.assert.notCalled(mocks.$drafts.remove)

      wrap.setProps({ replyTo: { messageID: '1002' } })
      sinon.assert.calledTwice(mocks.$drafts.get)
      sinon.assert.calledOnce(mocks.$drafts.set)
    })

    it('flush draft before destroy', () => {
      const wrap = mountFooter()
      wrap.setData({ draft: { content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] } })
      wrap.destroy()

      sinon.assert.calledOnce(mocks.$drafts.set)
    })

    it('flush draft removes draft if content is empty', () => {
      const wrap = mountFooter()
      wrap.destroy()

      sinon.assert.notCalled(mocks.$drafts.set)
      sinon.assert.calledOnce(mocks.$drafts.remove)
    })
  })

  it('prompt emoji picker', () => {
    const wrap = mountFooter()
    wrap.find('.input-button.emoji-button').trigger('mousedown')

    sinon.assert.calledOnce(mocks.$bus.$emit)
  })
})
