/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import Members from 'corteza-webapp-messaging/src/components/Panel/Rightside/Members'
import MemberItem from 'corteza-webapp-messaging/src/components/Channel/MemberItem'
import { User } from 'corteza-webapp-messaging/src/types'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import { VueSelect } from 'vue-select'
import fp from 'flush-promises'
import sinon from 'sinon'

describe('corteza-webapp-messaging/src/components/Panel/Rightside/Members.vue', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsData, $MessagingAPI, $SystemAPI, $auth
  beforeEach(() => {
    propsData = {
      channel: {
        channelID: 'ch.0001',
        members: ['u.0001', 'u.0002'],
        canChangeMembers: true,
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
      channelPart: sinon.stub().resolves({}),
      channelJoin: sinon.stub().resolves({}),
    }

    $SystemAPI = {
      userList: sinon.stub().resolves({}),
    }

    $auth = {
      user: { userID: 'u.0001' },
    }
  })

  const mountCmp = (opt) => {
    return shallowMount(Members, {
      mocks: { $MessagingAPI, $SystemAPI, $auth },
      propsData,
      ...opt,
    })
  }

  it('should fetch members on load', async () => {
    $SystemAPI.userList = sinon.stub().resolves({
      set: [{ userID: 'u.0001', name: 'u1' }],
    })

    const wrap = mountCmp()
    await fp()

    sinon.assert.calledOnce($SystemAPI.userList)
    expect(wrap.findAll(MemberItem)).to.have.length(1)
  })

  it('should be able to remove members', async () => {
    $SystemAPI.userList = sinon.stub().resolves({
      set: [{ userID: 'u.0001', name: 'u1' }],
    })

    const wrap = mountCmp()
    await fp()

    const m = wrap.find(MemberItem)
    m.vm.$emit('removeMember', { userID: 'u.0001' })

    sinon.assert.calledOnce($MessagingAPI.channelPart)
  })

  it('should be able to add members', async () => {
    $SystemAPI.userList = sinon.stub().resolves({
      set: [{ userID: 'u.0001', name: 'u1' }],
    })

    const wrap = mountCmp()
    await fp()

    const m = wrap.find(VueSelect)
    m.vm.$emit('input', new User({ userID: 'u.0001' }))

    sinon.assert.calledOnce($MessagingAPI.channelJoin)
  })
})
