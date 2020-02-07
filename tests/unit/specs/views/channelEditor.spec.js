/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { fullMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import ChannelEditor from 'corteza-webapp-messaging/src/views/ChannelEditor'
import ConfirmationRow from 'corteza-webapp-messaging/src/components/Form/ConfirmationRow'
import MemberItem from 'corteza-webapp-messaging/src/components/Channel/MemberItem'
import { User } from 'corteza-webapp-messaging/src/types'
import { VueSelect } from 'vue-select'
import fp from 'flush-promises'
import sinon from 'sinon'

describe('corteza-webapp-messaging/src/views/ChannelEditor.vue', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsData, $MessagingAPI, $SystemAPI, $auth, $store, $router
  beforeEach(() => {
    propsData = {
      channelID: 'ch.0001',
    }

    $store = {
      getters: {},
      commit: sinon.stub(),
    },
    $router = {
      push: sinon.stub(),
    }

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
    return fullMount(ChannelEditor, {
      mocks: { $MessagingAPI, $SystemAPI, $auth, $store, $router },
      propsData,
      ...opt,
    })
  }

  describe('state', () => {
    it('create a new channel', async () => {
      propsData.channelID = undefined
      const wrap = mountCE()

      const f = wrap.find('form.editor')
      f.trigger('submit')
      sinon.assert.calledOnce($MessagingAPI.channelCreate)
      const { channelID } = $MessagingAPI.channelCreate.args.pop().pop()
      expect(channelID).to.be.undefined
    })

    it('create a new channel of type', async () => {
      propsData.channelID = undefined
      propsData.type = 'private'
      const wrap = mountCE()

      const f = wrap.find('form.editor')
      f.trigger('submit')
      sinon.assert.calledOnce($MessagingAPI.channelCreate)
      const { type } = $MessagingAPI.channelCreate.args.pop().pop()
      expect(type).to.eq('private')
    })

    it('update existing channel', async () => {
      propsData.channelID = 'ch.0001'
      $MessagingAPI.channelRead = sinon.stub().resolves({ channelID: 'ch.0001' })
      const wrap = mountCE()
      await fp()

      const f = wrap.find('form.editor')
      f.trigger('submit')
      sinon.assert.calledOnce($MessagingAPI.channelUpdate)
      const { channelID } = $MessagingAPI.channelUpdate.args.pop().pop()
      expect(channelID).to.eq('ch.0001')
    })

    it('update channel\'s state', async () => {
      propsData.channelID = 'ch.0001'
      $MessagingAPI.channelRead = sinon.stub().resolves({
        channelID: 'ch.0001',
        deletedAt: undefined,
        canDelete: true,
        canArchive: false,
      })

      const wrap = mountCE()
      await fp()

      const cf = wrap.find(ConfirmationRow)
      cf.vm.$emit('confirmed')
      sinon.assert.calledOnce($MessagingAPI.channelState)
      const { channelID } = $MessagingAPI.channelState.args.pop().pop()
      expect(channelID).to.eq('ch.0001')
    })

    it('provide user search when adding new members', async () => {
      propsData.channelID = undefined
      $SystemAPI.userList = sinon.stub().resolves({
        set: [{ userID: 'u.0001' }, { userID: 'u.0002' }],
      })

      const wrap = mountCE()
      await fp()

      const vs = wrap.find(VueSelect)
      vs.vm.$emit('search', 'query')
      await fp()
      expect(vs.props().options).to.have.length(2)
    })
    it('update state on member add', async () => {
      propsData.channelID = undefined

      const wrap = mountCE()
      await fp()

      const vs = wrap.find(VueSelect)
      vs.vm.$emit('input', new User({ userID: 'u.0001' }))
      await fp()
      expect(wrap.findAll(MemberItem)).to.have.length(1)
    })

    it('don\'t update state on no member added (vue-select thing)', async () => {
      propsData.channelID = undefined

      const wrap = mountCE()
      await fp()

      const vs = wrap.find(VueSelect)
      vs.vm.$emit('input')
      await fp()
      expect(wrap.findAll(MemberItem)).to.have.length(0)
    })

    it.skip('update state on member remove', async () => {
      propsData.channelID = 'ch.0001'
      $MessagingAPI.channelRead = sinon.stub().resolves({
        channelID: 'ch.0001',
        members: ['u.0001', 'u.0002'],
        deletedAt: undefined,
        canDelete: true,
        canArchive: false,
      })

      $SystemAPI.userList = sinon.stub().resolves({
        set: [{ userID: 'u.0001', name: 'uName1' }, { userID: 'u.0002', username: 'uName2' }]
      })

      const wrap = mountCE()
      await fp()

      const mi = wrap.find(MemberItem)
      mi.vm.$emit('removeMember', mi.props().user)
      expect(wrap.findAll(MemberItem)).to.have.length(1)
    })

    it('update channel\'s memberships', async () => {
      propsData.channelID = 'ch.0001'
      $MessagingAPI.channelRead = sinon.stub().resolves({
        channelID: 'ch.0001',
        members: ['u.0001', 'u.0002'],
        deletedAt: undefined,
        canDelete: true,
        canArchive: false,
      })

      $SystemAPI.userList = sinon.stub().resolves({
        set: [{ userID: 'u.0001' }, { userID: 'u.0002' }]
      })

      const wrap = mountCE()
      await fp()

      // Add member
      wrap.find(VueSelect).vm.$emit('input', new User({ userID: 'u.0003' }))

      const mi = wrap.find(MemberItem)
      mi.vm.$emit('removeMember', mi.props().user)

      wrap.find('form.editor').trigger('submit')
      await fp()

      sinon.assert.calledOnce($MessagingAPI.channelJoin)
      let args = $MessagingAPI.channelJoin.args.pop().pop()
      expect(args.channelID).to.eq('ch.0001')
      expect(args.userID).to.eq('u.0003')

      sinon.assert.calledOnce($MessagingAPI.channelPart)
      args = $MessagingAPI.channelPart.args.pop().pop()
      expect(args.channelID).to.eq('ch.0001')
      expect(args.userID).to.eq('u.0001')
    })
  })

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
