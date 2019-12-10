/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import CChannel from 'corteza-webapp-messaging/src/views/Channel'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import { Channel } from 'corteza-webapp-messaging/src/types'
import fp from 'flush-promises'
import sinon from 'sinon'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('corteza-webapp-messaging/src/views/Channel.vue', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsData, $MessagingAPI, $SystemAPI, $auth, store
  beforeEach(() => {
    propsData = {
      channelID: 'ch.0001',
    }

    $MessagingAPI = {
      statusList: sinon.stub().resolves([]),
      searchMessages: sinon.stub().resolves({}),
      searchChannels: sinon.stub().resolves({}),
      messagePinRemove: sinon.stub().resolves({}),
      messagePinCreate: sinon.stub().resolves({}),
      messageBookmarkRemove: sinon.stub().resolves({}),
      messageBookmarkCreate: sinon.stub().resolves({}),
      messageReactionRemove: sinon.stub().resolves({}),
      messageReactionCreate: sinon.stub().resolves({}),
      messageDelete: sinon.stub().resolves({}),
    }

    $SystemAPI = {
      userList: sinon.stub().resolves({}),
    }

    $auth = {
      user: { userID: 'u.0001' },
    }

    store = new Vuex.Store({ modules: {
      channels: {
        namespaced: true,
        state: {},
        getters: {
          findByID: () => () => new Channel({ channelID: 'ch.0001' }),
          findWhereMember: () => () => [],
        },
      },
      unread: {
        namespaced: true,
        state: {},
        getters: {
          find: () => () => ({}),
        },
        actions: {
          fromMessage: async () => {},
        },
      },
      session: {
        namespaced: true,
        state: {},
        getters: {
          canCreateGroupChannel: () => {},
        },
      },
      ui: {
        namespaced: true,
        state: {},
        getters: {
          enableSubmitButton: () => {},
        },
      },
    }})
  })

  const mountCmp = (opt) => {
    return shallowMount(CChannel, {
      mocks: { $MessagingAPI, $SystemAPI, $auth },
      store,
      localVue,
      propsData,
      ...opt,
    })
  }

  describe('state', () => {
    it('should fetch messages on load', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        { messageID: '0001', channelID: 'ch.0001', message: 'content1' },
        { messageID: '0002', channelID: 'ch.0001', message: 'content2' },
      ])

      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      sinon.assert.calledOnce($MessagingAPI.searchMessages)

      const { messages } = msgs.props()
      expect(messages).to.have.length(2)
      expect(messages[0].messageID).to.eq('0001')
      expect(messages[1].messageID).to.eq('0002')
    })

    it('should ignore messages for different channels', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        { messageID: '0001', channelID: 'ch.0001', message: 'content1' },
        { messageID: '0001', channelID: 'ch.0001', replyTo: 'm.0002', message: 'content1.1' },
        { messageID: '0002', channelID: 'ch.0002', message: 'content2' },
        { messageID: '0001', channelID: 'ch.0002', replyTo: 'm.0002', message: 'content2.1' },
      ])

      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      sinon.assert.calledOnce($MessagingAPI.searchMessages)

      const { messages } = msgs.props()
      expect(messages).to.have.length(1)
      expect(messages[0].messageID).to.eq('0001')
    })

    it('should fetch users for given messages', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        { messageID: '0001', channelID: 'ch.0001', userID: 'u.0001', message: 'content1' },
        { messageID: '0002', channelID: 'ch.0001', userID: 'u.0002', message: 'content2' },
      ])

      $SystemAPI.userList = sinon.stub().resolves({
        set: [{ userID: 'u.0001', name: 'user.1' }, { userID: 'u.0002', name: 'user.2' }],
      })

      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      sinon.assert.calledOnce($SystemAPI.userList)

      const { messages } = msgs.props()
      expect(messages).to.have.length(2)
      expect(messages[0].user.userID).to.eq('u.0001')
      expect(messages[1].user.userID).to.eq('u.0002')
    })

    it('should fetch users for given reactions', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        {
          messageID: '0001',
          channelID: 'ch.0001',
          userID: 'u.0001',
          message: 'content1',
          reactions: [
            { reaction: 'r1', count: 1, userIDs: ['u.0001'] },
            { reaction: 'r2', count: 1, userIDs: ['u.0002'] },
          ],
        },
      ])

      $SystemAPI.userList = sinon.stub().resolves({
        set: [{ userID: 'u.0001', name: 'user.1' }, { userID: 'u.0002', name: 'user.2' }],
      })

      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      sinon.assert.calledOnce($SystemAPI.userList)

      const { messages: [ message ] } = msgs.props()
      expect(message.user.userID).to.eq('u.0001')
      expect(message.reactions[0].users).to.have.length(1)
      expect(message.reactions[0].users[0].userID).to.eq('u.0001')
      expect(message.reactions[1].users).to.have.length(1)
      expect(message.reactions[1].users[0].userID).to.eq('u.0002')
    })

    it('should fetch users for given mentions', (done) => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        {
          messageID: '0001',
          channelID: 'ch.0001',
          userID: 'u.0001',
          mentions: ['0003'],
          message: 'for <@0003>',
        },
      ])

      $SystemAPI.userList = sinon.stub().resolves({
        set: [{ userID: 'u.0001', name: 'user.1' }, { userID: '0003', name: 'user.3' }],
      })

      const wrap = mountCmp()
      const msgs = wrap.find(Messages)

      setTimeout(() => {
        sinon.assert.calledOnce($SystemAPI.userList)
        const { messages: [ message ] } = msgs.props()
        expect(message.message).to.eq('for <@0003 user.3>')
        done()
      }, 10)
    })

    it('correctly update message user\'s status', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        { messageID: '0001', channelID: 'ch.0001', userID: 'u.0003', message: 'content1' },
      ])

      $SystemAPI.userList = sinon.stub().resolves({
        set: [{ userID: 'u.0003', name: 'user.3' }],
      })

      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      let props = msgs.props()
      expect(props.messages[0].user.online).to.be.false

      // Force update, to check if it works as intended
      wrap.vm.onUsersUpdate({ 'u.0003': { userID: 'u.0003', online: true } })
      await fp()
      props = msgs.props()
      expect(props.messages[0].user.online).to.be.true

      wrap.vm.onUsersUpdate({ 'u.0003': { userID: 'u.0003', online: false } })
      await fp()
      props = msgs.props()
      expect(props.messages[0].user.online).to.be.false
    })
  })

  describe('message', () => {
    beforeEach(() => {
      window.MessagingAPI = 'http://base.ur.tld'
    })
    it('determine attachment\'s url when only path is provided', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        {
          messageID: '0001',
          channelID: 'ch.0001',
          att: {
            attachmentID: 'att.0001',
            url: '/path/att.ext',
            previewUrl: '/path/att.ext/prv',
          },
        },
      ])

      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      const { messages: [ msg ] } = msgs.props()
      expect(msg.attachment).to.deep.include({
        attachmentID: 'att.0001',
        url: 'http://base.ur.tld/path/att.ext',
        previewUrl: 'http://base.ur.tld/path/att.ext/prv',
      })
    })

    it('determine attachment\'s url when full URL is provided', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        {
          messageID: '0001',
          channelID: 'ch.0001',
          att: {
            attachmentID: 'att.0001',
            url: 'http://base.ur.tld/path/att.ext',
            previewUrl: 'http://base.ur.tld/path/att.ext/prv',
          },
        },
      ])

      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      const { messages: [ msg ] } = msgs.props()
      expect(msg.attachment).to.deep.include({
        attachmentID: 'att.0001',
        url: 'http://base.ur.tld/path/att.ext',
        previewUrl: 'http://base.ur.tld/path/att.ext/prv',
      })
    })
  })
})
