/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import PinnedMessages from 'corteza-webapp-messaging/src/components/Panel/Rightside/PinnedMessages'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import fp from 'flush-promises'
import sinon from 'sinon'

describe('corteza-webapp-messaging/src/components/Panel/Rightside/PinnedMessages.vue', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsData, $MessagingAPI, $SystemAPI, $auth
  beforeEach(() => {
    propsData = {
      channel: {
        channelID: 'ch.0001',
        members: [],
      },
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
  })

  const mountCmp = (opt) => {
    return shallowMount(PinnedMessages, {
      mocks: { $MessagingAPI, $SystemAPI, $auth },
      propsData,
      ...opt,
    })
  }

  describe('state', () => {
    it('should fetch messages on load', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        { messageID: '0001', message: 'content1' },
        { messageID: '0002', message: 'content2' },
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

    it('should fetch users for given messages', async () => {
      $MessagingAPI.searchMessages = sinon.stub().resolves([
        { messageID: '0001', userID: 'u.0001', message: 'content1' },
        { messageID: '0002', userID: 'u.0002', message: 'content2' },
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
  })
})
