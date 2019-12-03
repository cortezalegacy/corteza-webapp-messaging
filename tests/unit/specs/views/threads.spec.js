/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import Threads from 'corteza-webapp-messaging/src/views/Threads'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import fp from 'flush-promises'
import sinon from 'sinon'

describe('corteza-webapp-messaging/src/views/Threads.vue', () => {
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
    return shallowMount(Threads, {
      mocks: { $MessagingAPI, $SystemAPI, $auth },
      propsData,
      ...opt,
    })
  }

  describe('state', () => {
    it('should fetch threads on load', async () => {
      $MessagingAPI.searchThreads = sinon.stub().resolves([
        { messageID: '0001', message: 'content1', replies: 2 },
        { messageID: '0002', message: 'content1', replies: 1 },
        { messageID: '0003', message: 'content1', replies: 0 },
        { messageID: '0004', message: 'content1', replyTo: '0001' },
      ])

      const wrap = mountCmp()
      await fp()

      expect(wrap.findAll(Messages)).to.have.length(2)
    })

    it('should group messages under topics', async () => {
      $MessagingAPI.searchThreads = sinon.stub().resolves([
        { messageID: '0001', message: 'content1', replies: 3 },
        { messageID: '0002', message: 'content1', replyTo: '0001' },
        { messageID: '0003', message: 'content1', replyTo: '0001' },
        { messageID: '0004', message: 'content1', replyTo: '0001' },
      ])

      const wrap = mountCmp()
      await fp()

      expect(wrap.findAll(Messages)).to.have.length(1)
      const m = wrap.find(Messages)
      const { messages } = m.props()
      expect(messages).to.have.length(4)
    })
  })
})
