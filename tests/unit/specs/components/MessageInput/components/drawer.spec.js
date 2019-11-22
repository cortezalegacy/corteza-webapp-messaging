/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount, fullMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import Drawer from 'corteza-webapp-messaging/src/components/MessageInput/components/Drawer'
import Mention from 'corteza-webapp-messaging/src/components/MessageInput/components/Drawer/Mention'
import sinon from 'sinon'

describe('components/MessageInput/components/Drawer', () => {
  afterEach(() => {
    sinon.restore()
  })

  let propsDataS, propsDataF
  beforeEach(() => {
    propsDataS = { suggestions: undefined }
    propsDataF = { suggestions: undefined }
  })

  const smDrawer = (opt) => shallowMount(Drawer, {
    mocks: {},
    propsData: propsDataS,
    ...opt,
  })

  const fmDrawer = (opt) => fullMount(Drawer, {
    mocks: {},
    propsData: propsDataF,
    ...opt,
  })

  it('determine able to determine appropriate component for given plugin (if any)', () => {
    const tests = [
      { name: 'known component, successfully determined', plugin: 'Mention', expected: true },
      { name: 'unknown component, determination failed', plugin: 'NotDefinedEver', expected: false },
    ]

    for (const t of tests) {
      propsDataS.plugin = t.plugin
      const wrap = smDrawer()
      expect(wrap.find('.invalid').exists(), t.name).to.eq(!t.expected)
    }
  })

  describe('mention plugin\'s drawer', () => {
    it('correctly determine and render suggestions list', () => {
      propsDataF.plugin = 'Mention'
      const tests = [
        {
          name: 'render user mentions',
          suggestions: [
            { id: '0001', value: 'u1', type: 'User', user: {} },
            { id: '0002', value: 'u2', type: 'User', user: {} },
          ],
          qs: '.suggestion.user',
          expected: 2,
        },
        {
          name: 'render channel mentions',
          suggestions: [
            { id: '1001', value: 'c1', type: 'Channel', channel: {} },
            { id: '1002', value: 'c2', type: 'Channel', channel: {} },
          ],
          qs: '.suggestion.channel',
          expected: 2,
        },
      ]
    
      for (const t of tests) {
        propsDataF.suggestions = t.suggestions
        const wrap = fmDrawer()
        expect(wrap.findAll(t.qs), t.name).to.have.length(t.expected)
      }
    })

    it('suggestion items should emit click events', () => {
      propsDataF.plugin = 'Mention'
      const tests = [
        {
          name: 'user mention',
          suggestions: [
            { id: '0001', value: 'u1', type: 'User', user: {} },
          ],
          qs: '.suggestion.user',
          expected: 2,
        },
        {
          name: 'channel mention',
          suggestions: [
            { id: '1001', value: 'c1', type: 'Channel', channel: {} },
          ],
          qs: '.suggestion.channel',
          expected: 2,
        },
      ]
    
      for (const t of tests) {
        const suggestionSelect = sinon.mock()

        propsDataF.suggestions = t.suggestions
        const wrap = fmDrawer({
          listeners: { suggestionSelect }
        })

        const li = wrap.find(t.qs)
        li.trigger('click', {})
        sinon.assert.calledOnce(suggestionSelect)

        sinon.restore()
      }
    })

    it('correctly determine scroll adjustments', () => {
      const tests = [
        {
          name: 'no need to adjust - top edge',
          p: { clientHeight: 100, scrollTop: 0 },
          c: { clientHeight: 10, offsetTop: 0 },
          expected: undefined,
        },
        {
          name: 'no need to adjust - top',
          p: { clientHeight: 100, scrollTop: 0 },
          c: { clientHeight: 10, offsetTop: 10 },
          expected: undefined,
        },
        {
          name: 'adjust - top',
          p: { clientHeight: 100, scrollTop: 10 },
          c: { clientHeight: 10, offsetTop: 0 },
          expected: 0,
        },

        {
          name: 'no need to adjust - bottom',
          p: { clientHeight: 100, scrollTop: 0 },
          c: { clientHeight: 10, offsetTop: 80 },
          expected: undefined,
        },
        {
          name: 'no need to adjust - bottom edge',
          p: { clientHeight: 100, scrollTop: 0 },
          c: { clientHeight: 10, offsetTop: 90 },
          expected: undefined,
        },
        {
          name: 'adjust - bottom',
          p: { clientHeight: 100, scrollTop: 0 },
          c: { clientHeight: 10, offsetTop: 100 },
          expected: 10,
        },
      ]

      const fn = Mention.methods.checkPositioning
      for (const t of tests) {
        expect(fn(t.p, t.c, 1), t.name).to.eq(t.expected)
      }
    })
  })
})
