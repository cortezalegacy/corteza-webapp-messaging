/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import Footer from 'corteza-webapp-messaging/src/components/Chat/Footer'
import MessageInput from 'corteza-webapp-messaging/src/components/MessageInput'
import { Activity } from 'corteza-webapp-messaging/src/components/Chat/Footer/types'
import CActivity from 'corteza-webapp-messaging/src/components/Chat/Footer/Activity'
import { Channel } from 'corteza-webapp-messaging/src/types/channel'
import { User } from 'corteza-webapp-messaging/src/types'
import fp from 'flush-promises'
import sinon from 'sinon'
import Vuex from 'vuex'
import { createLocalVue, mount } from '@vue/test-utils'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('components/Chat/Footer/Footer', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsData, $MessagingAPI, $SystemAPI, $auth, mocks, store, $commands
  beforeEach(() => {
    propsData = {
      channel: { channelID: '0001', members: [] },
      users: {
        'u.0001': new User({ name: 'user.0001', userID: 'u.0001' }),
        'u.0002': new User({ name: 'user.0002', userID: 'u.0002' }),
      },
    }

    $auth = {
      user: { userID: 'u.0001' },
    }

    $MessagingAPI = {
      activitySend: sinon.stub().resolves({}),
      messageReplyCreate: sinon.stub().resolves({}),
      messageCreate: sinon.stub().resolves({}),
    }

    $SystemAPI = {
      userList: sinon.stub().resolves({}),
    }

    $commands = {
      test: sinon.stub().returns(false),
      exec: sinon.stub().resolves(),
    }

    mocks = {
      $MessagingAPI,
      $SystemAPI,
      $auth,
      $drafts: { get: sinon.stub(), set: sinon.stub(), remove: sinon.stub() },
      $commands,
      $bus: {
        $on: sinon.stub(),
        $off: sinon.stub(),
        $emit: sinon.stub(),
      },
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

  describe('suggestions', () => {
    it('fetch prioritized users on load', async () => {
      propsData.suggestionPriorities = {
        User: new Set(['u.0001', 'u.0002']),
      }
      $SystemAPI.userList = sinon.stub().resolves({ set: [{ name: 'test.user.1' }, { name: 'test.user.2' }] })

      const wrap = mountFooter()
      const input = wrap.find(MessageInput)
      await fp()

      const { userSuggestions } = input.props()
      expect(userSuggestions).to.have.length(2)
      expect(userSuggestions[0].user.name).to.eq('test.user.1')
      expect(userSuggestions[1].user.name).to.eq('test.user.2')
    })

    it('request suggestions', async () => {
      const wrap = mountFooter()
      const input = wrap.find(MessageInput)

      $SystemAPI.userList = sinon.stub().resolves({ set: [{ name: 'test.user.1' }, { name: 'test.user.2' }] })
      input.vm.$emit('requestSuggestions', { type: 'user', query: 'test.user' })
      await fp()

      const { userSuggestions } = input.props()
      expect(userSuggestions).to.have.length(2)
      expect(userSuggestions[0].user.name).to.eq('test.user.1')
      expect(userSuggestions[1].user.name).to.eq('test.user.2')
    })
  })

  describe('activities', () => {
    it('react to new activity', () => {
      const tests = [
        {
          name: 'ignore if owner',
          activity: {
            userID: $auth.user.userID,
          },
          expected: function (act) {
            expect(act.props().users).to.have.length(0)
          },
        },
        {
          name: 'ignore if not relevant for channel',
          activity: {
            userID: 'u.0002',
            channelID: 'c.0002',
          },
          expected: function (act) {
            expect(act.props().users).to.have.length(0)
          },
        },
        {
          name: 'ignore if not relevant for thread',
          activity: {
            userID: 'u.0002',
            channelID: propsData.channel.channelID,
            messageID: 'm.0002',
            kind: 'replying',
          },
          propsData: { replyToID: 'm.0001' },
          expected: function (act) {
            expect(act.props().users).to.have.length(0)
          },
        },
        {
          name: 'ignore if not a desired type',
          activity: {
            userID: 'u.0002',
            channelID: propsData.channel.channelID,
            messageID: 'm.0002',
            kind: 'something',
          },
          propsData: { replyToID: 'm.0001' },
          expected: function (act) {
            expect(act.props().users).to.have.length(0)
          },
        },
        {
          name: 'update existing',
          activity: {
            userID: 'u.0002',
            channelID: propsData.channel.channelID,
            kind: 'typing',
          },
          stateData: { channelActivities: [new Activity({ kind: 'typing', userID: 'u.0002', channelID: propsData.channel.channelID })] },
          expected: function (act) {
            expect(act.props().users).to.have.length(1)
          },
        },
        {
          name: 'add new',
          activity: {
            userID: 'u.0002',
            channelID: propsData.channel.channelID,
            kind: 'typing',
          },
          expected: function (act) {
            expect(act.props().users).to.have.length(1)
          },
        },
      ]

      for (const t of tests) {
        propsData = { ...propsData, ...t.propsData }
        const wrap = mountFooter()
        wrap.setData({ ...t.stateData })
        wrap.vm.onActivity(t.activity)
        const act = wrap.find(CActivity)
        expect(act.exists(), t.name).to.be.true
        t.expected(act)
      }
    })

    it('determine users for given activities', () => {
      const wrap = mountFooter()
      wrap.vm.onActivity({
        userID: 'u.0002',
        channelID: propsData.channel.channelID,
        kind: 'typing',
      })
      const act = wrap.find(CActivity)


      expect(act.props().users).to.have.length(1)
    })
  })
})
