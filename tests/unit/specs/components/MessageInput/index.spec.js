/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { fullMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import User from 'corteza-webapp-messaging/src/components/MessageInput/components/Drawer/Mention/User'
import Channel from 'corteza-webapp-messaging/src/components/MessageInput/components/Drawer/Mention/Channel'
import MessageInput from 'corteza-webapp-messaging/src/components/MessageInput'
import fp from 'flush-promises'
import sinon from 'sinon'
import fuzzysort from 'fuzzysort'

describe('components/MessageInput', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsData
  beforeEach(() => {
    propsData = {
      noFocus: true
    }
  })

  const mountMI = async (opt) => {
    const wrap = fullMount(MessageInput, {
      mocks: {},
      propsData,
      ...opt,
    })

    return fp().then(() => wrap)
  }

  describe('data model', () => {
    it('emit null if content is empty', async () => {
      propsData.value = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'text' }] }] }
      const wrap = await mountMI()
      const editor = wrap.vm.editor

      wrap.vm.set({ content: '' })
      // This has to be done, because `set` won't trigger emit
      editor.emitUpdate()

      // Simulates v-model flow
      expect(wrap.emitted().input.pop().pop()).to.be.null
    })

    it('enables v-model directive', async () => {
      const wrap = await mountMI()
      const editor = wrap.vm.editor

      expect(editor.state.doc.textContent).to.eq('')
      wrap.vm.insert({ content: 'content' })

      // Simulates v-model flow
      wrap.setProps({ value: wrap.emitted().input.pop().pop() })
      expect(editor.state.doc.textContent).to.eq('content')

      // Simulates v-model flow
      wrap.setProps({ value: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'text' }] }] } })
      expect(editor.state.doc.textContent).to.eq('text')
    })
  })

  // @todo test if they do what they are supposed to do.
  // JSDom prevents this -- find a work around.
  describe('API for wrapper components', () => {
    it('focus', () => {
      expect(MessageInput.methods.focus).to.not.be.undefined
    })

    it('blur', () => {
      expect(MessageInput.methods.blur).to.not.be.undefined
    })

    it('insert', () => {
      expect(MessageInput.methods.insert).to.not.be.undefined
    })

    it('set', () => {
      expect(MessageInput.methods.set).to.not.be.undefined
    })
  })

  describe('placeholders', () => {
    const getPH = wrap => wrap.find('.placeholder').attributes()['data-empty-text']

    it('set on init', async () => {
      const tests = [
        { name: 'default placeholder', placeholder: undefined, expected: 'message.newPlaceholder' },
        { name: 'custom placeholder', placeholder: 'ph.c', expected: 'ph.c' },
      ]

      for (const t of tests) {
        propsData.placeholder = t.placeholder
        const wrap = await mountMI()
        expect(getPH(wrap)).to.eq(t.expected)
      }
    })

    it('reactive updating', async () => {
      propsData.placeholder = 'ph.1'
      const wrap = await mountMI()
      expect(getPH(wrap)).to.eq('ph.1')

      wrap.setProps({ placeholder: 'ph.2' })
      expect(getPH(wrap)).to.eq('ph.2')
    })
  })

  describe('mentions', () => {
    let wrap
    beforeEach(async () => {
      propsData.userSuggestions = [
        { name: fuzzysort.prepare('a'), type: 'User', id: '0001', user: {} },
        { name: fuzzysort.prepare('b'), type: 'User', id: '0002', user: {} },
      ]
      propsData.channelSuggestions = [
        { name: fuzzysort.prepare('c'), type: 'Channel', id: '1001', channel: {} },
        { name: fuzzysort.prepare('d'), type: 'Channel', id: '1002', channel: {} },
      ]
      wrap = await mountMI()
    })

    it('user suggestions', async () => {
      wrap.vm.insert({ content: '@' })
      expect(wrap.findAll(User)).to.have.length(2)

      wrap.vm.insert({ content: 'a' })
      expect(wrap.findAll(User)).to.have.length(1)
    })

    it('channel suggestions', async () => {
      wrap.vm.insert({ content: '#' })
      expect(wrap.findAll(Channel)).to.have.length(2)

      wrap.vm.insert({ content: 'c' })
      expect(wrap.findAll(Channel)).to.have.length(1)
    })

    it('with priorities', async () => {
      wrap.setProps({
        suggestionPriorities: {
          User: new Set([ '0001' ]),
        }
      })

      wrap.vm.insert({ content: '@' })
      expect(wrap.findAll(User)).to.have.length(1)
    })
  })
})
