/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import Thread from 'corteza-webapp-messaging/src/components/Panel/Rightside/Thread'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import { Message } from 'corteza-webapp-messaging/src/types'
import fp from 'flush-promises'
import sinon from 'sinon'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('corteza-webapp-messaging/src/components/Panel/Rightside/Thread.vue', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsData, $MessagingAPI, $SystemAPI, $auth, store, $bus
  beforeEach(() => {
    propsData = {
      channel: {
        channelID: 'ch.0001',
        members: [],
      },
      message: new Message({
        messageID: '50001',
        channelID: 'ch.0001',
        userID: 'u.0001',
      }),
    }

    $MessagingAPI = {
      statusList: sinon.stub().resolves([]),
      searchMessages: sinon.stub().resolves({}),
      searchThreads: sinon.stub().resolves({}),
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
          findByID: () => () => ({ channelID: 'ch.0001' }),
          findWhereMember: () => () => [],
        },
      },
      unread: {
        namespaced: true,
        state: {},
        getters: {
          find: () => () => ({}),
        },
      },
      session: {
        namespaced: true,
        state: {},
        getters: {
          canCreateGroupChannel: () => {},
        },
      },
    }})
  })

  const mountCmp = (opt) => {
    return shallowMount(Thread, {
      mocks: { $MessagingAPI, $SystemAPI, $auth },
      store,
      localVue,
      propsData,
      ...opt,
    })
  }

  it('filter messages only specific to this thread', async () => {
    $MessagingAPI.searchMessages = sinon.stub().resolves([
      { replyTo: '50001', messageID: '50002', message: 'content1', channelID: 'ch.0001' },
      { replyTo: '50002', messageID: '50003', message: 'content2', channelID: 'ch.0001' },
      { replyTo: '50001', messageID: '50003', message: 'content2', channelID: 'ch.0002' },
      { messageID: '50003', message: 'content2', channelID: 'ch.0001' },
      { messageID: '50003', message: 'content2', channelID: 'ch.0002' },
    ])

    const wrap = mountCmp()
    const msgs = wrap.find(Messages)
    await fp()

    expect(msgs.props().messages).to.have.length(2)
  })

  describe('state', () => {
    it('should fetch messages on load', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        { replyTo: '50001', messageID: '50002', message: 'content1', channelID: 'ch.0001' },
        { replyTo: '50001', messageID: '50003', message: 'content2', channelID: 'ch.0001' },
      ])

      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      sinon.assert.calledOnce($MessagingAPI.searchMessages)

      const { messages } = msgs.props()
      expect(messages).to.have.length(3)
      expect(messages[0].messageID).to.eq('50001')
      expect(messages[1].messageID).to.eq('50002')
      expect(messages[2].messageID).to.eq('50003')
    })

    it('should fetch users for given messages', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        { replyTo: '50001', userID: 'u.0001', messageID: '50002', message: 'content1', channelID: 'ch.0001' },
        { replyTo: '50001', userID: 'u.0002', messageID: '50003', message: 'content2', channelID: 'ch.0001' },
      ])

      $SystemAPI.userList = sinon.stub().resolves({
        set: [{ userID: 'u.0001', name: 'user.1' }, { userID: 'u.0002', name: 'user.2' }],
      })

      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      sinon.assert.calledOnce($SystemAPI.userList)

      const { messages } = msgs.props()
      expect(messages).to.have.length(3)
      expect(messages[0].user.userID).to.eq('u.0001')
      expect(messages[1].user.userID).to.eq('u.0001')
      expect(messages[2].user.userID).to.eq('u.0002')
    })

    it('should fetch users for given reactions', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        {
          replyTo: '50001',
          channelID: 'ch.0001',
          messageID: '50002',
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

      const { messages: [ _, message ] } = msgs.props()
      expect(message.user.userID).to.eq('u.0001')
      expect(message.reactions[0].users).to.have.length(1)
      expect(message.reactions[0].users[0].userID).to.eq('u.0001')
      expect(message.reactions[1].users).to.have.length(1)
      expect(message.reactions[1].users[0].userID).to.eq('u.0002')
    })

    it('should fetch users for given mentions', (done) => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        {
          replyTo: '50001',
          channelID: 'ch.0001',
          messageID: '50002',
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
        const { messages: [ _, message ] } = msgs.props()
        expect(message.message).to.eq('for <@0003 user.3>')
        done()
      }, 10)
    })
  })

  describe('message', () => {
    it('create message reaction', async () => {
      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      msgs.vm.$emit('messageReaction', {
        message: { messageID: 'msg.0001', reactions: [] },
        reaction: ':smile:'
      })
      sinon.assert.calledOnce($MessagingAPI.messageReactionCreate)
      const args = $MessagingAPI.messageReactionCreate.args.pop().pop()
      expect(args.reaction).to.eq(':smile:')
    })

    it('remove message reaction', async () => {
      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      msgs.vm.$emit('messageReaction', {
        message: { messageID: 'msg.0001', reactions: [{ reaction: ':smile:', userIDs: ['u.0001'] }] },
        reaction: ':smile:'
      })

      sinon.assert.calledOnce($MessagingAPI.messageReactionRemove)
      const args = $MessagingAPI.messageReactionRemove.args.pop().pop()
      expect(args.reaction).to.eq(':smile:')
    })

    it('bookmark message', async () => {
      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      msgs.vm.$emit('bookmarkMessage', {
        message: new Message({ messageID: '00001' }),
      })
      await fp()

      sinon.assert.calledOnce($MessagingAPI.messageBookmarkCreate)
      const args = $MessagingAPI.messageBookmarkCreate.args.pop().pop()
      expect(args.messageID).to.eq('00001')
      expect(msgs.props().messages[0]).to.include({ messageID: '00001', isBookmarked: true })
    })

    it('remove bookmark from message', async () => {
      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      msgs.vm.$emit('bookmarkMessage', {
        message: new Message({ messageID: '00001', isBookmarked: true }),
      })
      await fp()

      sinon.assert.calledOnce($MessagingAPI.messageBookmarkRemove)
      const args = $MessagingAPI.messageBookmarkRemove.args.pop().pop()
      expect(args.messageID).to.eq('00001')
      expect(msgs.props().messages[0]).to.include({ messageID: '00001', isBookmarked: false })
    })

    it('pin message', async () => {
      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      msgs.vm.$emit('pinMessage', {
        message: new Message({ messageID: '00001' }),
      })
      await fp()

      sinon.assert.calledOnce($MessagingAPI.messagePinCreate)
      const args = $MessagingAPI.messagePinCreate.args.pop().pop()
      expect(args.messageID).to.eq('00001')
      expect(msgs.props().messages[0]).to.include({ messageID: '00001', isPinned: true })
    })

    it('remove pin from message', async () => {
      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      await fp()

      msgs.vm.$emit('pinMessage', {
        message: new Message({ messageID: '00001', isPinned: true }),
      })
      await fp()

      sinon.assert.calledOnce($MessagingAPI.messagePinRemove)
      const args = $MessagingAPI.messagePinRemove.args.pop().pop()
      expect(args.messageID).to.eq('00001')
      expect(msgs.props().messages[0]).to.include({ messageID: '00001', isPinned: false })
    })

    //  onPinMessage
    it('delete message', async () => {
      window.confirm = sinon.stub().returns(true)
      const wrap = mountCmp()
      const msgs = wrap.find(Messages)
      msgs.vm.$emit('deleteMessage', { message: { messageID: 'm.0001' } })
      await fp()

      sinon.assert.calledOnce($MessagingAPI.messageDelete)
    })

    it('handle add reaction over bus', async () => {
      const wrap = mountCmp()
      const msgs = wrap.find(Messages)

      wrap.vm.onReaction({ messageID: '50001', reaction: ':smile:', userID: 'u.0001', add: true })
      await fp()
      const msg = msgs.props().messages[0]
      expect(msg.reactions).to.have.length(1)
    })

    it('handle remove reaction over bus', async () => {
      const wrap = mountCmp()
      const msgs = wrap.find(Messages)

      wrap.vm.onReaction({ messageID: '50001', reaction: ':smile:', userID: 'u.0001', add: true })
      wrap.vm.onReaction({ messageID: '50001', reaction: ':smile:', userID: 'u.0001', add: false })
      await fp()
      const msg = msgs.props().messages[0]
      expect(msg.reactions).to.have.length(0)
    })
  })
})
