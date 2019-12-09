/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { fullMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import { Message, User } from 'corteza-webapp-messaging/src/types'
import CMessage from 'corteza-webapp-messaging/src/components/Messages/Message'
import EmbeddedBox from 'corteza-webapp-messaging/src/components/Messages/Message/EmbeddedBox'
import sinon from 'sinon'
import Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'

function makeAttachedMessage ({ ext = 'png', mimetype = 'image/png' } = {}) {
  return new Message({
    messageID: '10002',
    userID: 'u.0010',
    message: 'att.name',
    type: 'inlineImage',
    channelID: 'ch.0001',
    replies: 0,
    reactions: [],
    mentions: [],
    attachment: {
      attachmentID: 'att.0001',
      userID: 'u.0010',
      meta: {
        original:{ size: 311714, ext, mimetype, image: { width: 683, height: 752, animated: false } },
        preview:{ size: 6002, ext, mimetype, image: { width: 163, height: 180, animated: false } },
      },
      url: 'http://api.local.crust.tech:1024/messaging/attachment/120795184052044137',
      previewUrl: 'http://api.local.crust.tech:1024/messaging/attachment/120795184052044137',
    },
  })
}

function makeReactedMessage ({ ext = 'png', mimetype = 'image/png' } = {}) {
  return new Message({
    messageID: '10002',
    userID: 'u.0010',
    message: 'att.name',
    type: 'inlineImage',
    channelID: 'ch.0001',
    replies: 0,
    reactions: [
      {
        reaction: ':smile:',
        userIDs: ['u.0010'],
        users: [ new User({ userID: 'u.0010' }) ],
        count: 1,
      },
      {
        reaction: ':blush:',
        userIDs: ['u.0010'],
        users: [ new User({ userID: 'u.0010' }) ],
        count: 1,
      },
    ],
    mentions: [],
    attachment: {
      attachmentID: 'att.0001',
      userID: 'u.0010',
      meta: {
        original:{ size: 311714, ext, mimetype, image: { width: 683, height: 752, animated: false } },
        preview:{ size: 6002, ext, mimetype, image: { width: 163, height: 180, animated: false } },
      },
      url: 'http://api.local.crust.tech:1024/messaging/attachment/120795184052044137',
      previewUrl: 'http://api.local.crust.tech:1024/messaging/attachment/120795184052044137',
    },
  })
}

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

describe('components/Messages/Message', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsData, $MessagingAPI, $SystemAPI, $auth, mocks, $bus
  beforeEach(() => {
    propsData = {
      channel: { channelID: '0001', members: [] },
      message: new Message({ messageID: '1001', message: 'test' }),
      users: {},
      currentUser: { userID: 'u.0010' },
    }

    $auth = {
      user: {},
    }
    $bus = {
      $on: sinon.stub(),
      $off: sinon.stub(),
      $emit: sinon.stub(),
    }

    $MessagingAPI = {
      messageEdit: sinon.stub().resolves({}),
    }

    $SystemAPI = {
      userList: sinon.stub().resolves({}),
    }

    mocks = {
      $MessagingAPI,
      $SystemAPI,
      $auth,
      $drafts: { get: sinon.stub(), set: sinon.stub(), remove: sinon.stub() },
      $commands: { test: () => false },
      $bus,
    }
  })

  const mountMessage = (opt) => fullMount(CMessage, {
    store,
    localVue,
    mocks,
    propsData,
    ...opt,
  })

  describe('embedded content', () => {
    it('render message as embedded source', () => {
      propsData.message = new Message({ messageID: 'm.0001', message: 'https://www.youtube.com/watch?v=e6GdSfYVrCw' })
      const wrap = mountMessage()
      expect(wrap.find(EmbeddedBox).exists()).to.be.true
    })

    it('ignore if message can\'t be embedded', () => {
      propsData.message = new Message({ messageID: 'm.0001', message: 'invalid' })
      const wrap = mountMessage()
      expect(wrap.find(EmbeddedBox).exists()).to.be.false
    })
  })


  describe('attachment', () => {
    it('render inline preview when available', () => {
      propsData.message = makeAttachedMessage()
      const wrap = mountMessage({ stubs: ['preview-inline'] })
      expect(wrap.find('.test-inline-preview').exists()).to.be.true
    })

    it('request inline attachment preview', () => {
      propsData.message = makeAttachedMessage()
      const wrap = mountMessage({ stubs: ['preview-inline'] })
      wrap.find('.test-inline-preview').vm.$emit('openPreview', {})
      sinon.assert.calledOnce($bus.$emit)
    })

    it('show downloader when preview not available', () => {
      propsData.message = makeAttachedMessage({ mimetype: 'application/json', ext: 'json' })
      const wrap = mountMessage({ stubs: ['preview-inline'] })
      expect(wrap.find('.test-inline-preview').exists()).to.be.false
      expect(wrap.find('.no-preview').exists()).to.be.true
    })
  })

  describe('reactions', () => {
    it('render emojis', () => {
      propsData.message = makeReactedMessage()
      const wrap = mountMessage({ stubs: ['preview-inline'] })
    })
  })
})
