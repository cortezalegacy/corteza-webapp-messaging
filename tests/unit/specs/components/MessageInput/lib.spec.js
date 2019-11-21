/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import fuzzysort from 'fuzzysort'
import {
  contentEmpty,
  getDraft,
  stringifyDocument,
  parseDocument,
  getMatches,
} from 'corteza-webapp-messaging/src/components/MessageInput/lib'

describe('src/components/MessageInput/lib', () => {
  describe('contentEmpty', () => {
    const tests = [
      { name: 'undefined should be empty', document: undefined, expected: true },
      { name: 'null should be empty', document: null, expected: true },
      { name: 'empty object should be empty', document: {}, expected: true },
      { name: 'empty content should be empty', document: { content: [] }, expected: true },
      { name: 'valid and not empty document should not be empty', document: { content: [{ content: 'hi!' }] }, expected: false },
    ]

    for (const t of tests) {
      const vv = contentEmpty(t.document)
      expect(vv, t.namee).to.eq(t.expected)
    }
  })

  describe('getDraft', () => {
    it('determine draft object', () => {
      const tests = [
        { name: 'undefined value', draft: undefined, expected: null },
        { name: 'empty string', draft: '', expected: null },
        { name: 'delta object - discard', draft: { ops: [] }, expected: null },
        { name: 'doc object', draft: { type: 'doc', content: [] }, expected: { type: 'doc', content: [] } },
      ]

      for (const test of tests) {
        const d = getDraft(test.draft)
        expect(d, test.name).to.deep.eq(test.expected)
      }
    })
  })

  describe('stringifyDocument', () => {
    it('handle stringification', () => {
      const tests = [
        {
          name: 'plain text',
          doc: {
            content: [
              { type: 'paragraph', content: [ { type: 'text', text: 'l1' } ] },
              { type: 'paragraph', content: [ { type: 'text', text: 'l2' } ] },
            ]
          },
          expected: `l1\nl2`,
        },

        {
          name: 'handle empty lines; trim trailing lines',
          doc: {
            content: [
              { type: 'paragraph', content: [ { type: 'text', text: 'l1' } ] },
              { type: 'paragraph' },
              { type: 'paragraph', content: [ { type: 'text', text: 'l2' } ] },
              { type: 'paragraph' },
              { type: 'paragraph' },
            ]
          },
          expected: `l1\n\nl2`,
        },

        {
          name: 'user mentions',
          doc: {
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'text ' },
                  { type: 'mention-user', attrs: { id: '111', label: 'Mention User' } },
                  { type: 'text', text: ' text' },
                ],
              },
            ]
          },
          expected: `text <@111 Mention User> text`,
        },

        {
          name: 'channel mentions',
          doc: {
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'text ' },
                  { type: 'mention-channel', attrs: { id: '222', label: 'Mention Channel' } },
                  { type: 'text', text: ' text' },
                ],
              },
            ]
          },
          expected: `text <#222 Mention Channel> text`,
        },

        {
          name: 'null values',
          doc: null,
          expected: undefined,
        },
      ]

      for (const t of tests) {
        const ss = stringifyDocument(t.doc)
        expect(ss, t.name).to.eq(t.expected)
      }
    })
  })

  describe('parseDocument', () => {
    it('handle parsing', () => {
      const tests = [
        {
          name: 'plain text',
          message: `l1\nl2`,
          expected: {
            type: 'doc',
            content: [
              { type: 'paragraph', content: [ { type: 'text', text: 'l1' } ] },
              { type: 'paragraph', content: [ { type: 'text', text: 'l2' } ] },
            ]
          },
        },

        {
          name: 'handle empty lines; trim trailing lines',
          message: `l1\n\nl2`,
          expected: {
            type: 'doc',
            content: [
              { type: 'paragraph', content: [ { type: 'text', text: 'l1' } ] },
              { type: 'paragraph' },
              { type: 'paragraph', content: [ { type: 'text', text: 'l2' } ] },
            ]
          },
        },

        {
          name: 'user mentions',
          message: `text <@111 Mention User> text`,
          expected: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'text ' },
                  { type: 'mention-user', attrs: { id: '111', label: 'Mention User' } },
                  { type: 'text', text: ' text' },
                ],
              },
            ]
          },
        },

        {
          name: 'channel mentions',
          message: `text <#222 Mention Channel> text`,
          expected: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'text ' },
                  { type: 'mention-channel', attrs: { id: '222', label: 'Mention Channel' } },
                  { type: 'text', text: ' text' },
                ],
              },
            ]
          },
        },
      ]

      for (const t of tests) {
        const ss = parseDocument(t.message)
        expect(ss, t.name).to.deep.eq(t.expected)
      }
    })
  })

  describe('suggestion matching - getMatches', () => {
    it('convert query to NFD', () => {
      const items = [
        { name: fuzzysort.prepare('Zccs'), type: 'User', id: '0001' },
      ]
      const ss = getMatches({ items, query: 'Žćčš' })
      expect(ss).to.have.length(1)
    })

    it('no fuzyness if query is empty', () => {
      const items = [
        { name: fuzzysort.prepare('a'), type: 'User', id: '0001' },
        { name: fuzzysort.prepare('b'), type: 'User', id: '0002' },
        { name: fuzzysort.prepare('c'), type: 'User', id: '0003' },
      ]
      const ss = getMatches({ items })
      expect(ss).to.have.length(3)
    })

    it('determine final list based on priorities & scores', () => {
      const items = [
        { name: fuzzysort.prepare('testko'), email: fuzzysort.prepare('testko'), type: 'User', id: '0001' },
        { name: fuzzysort.prepare('testko1'), email: fuzzysort.prepare('testko1'), type: 'User', id: '0002' },
        { name: fuzzysort.prepare('testko2'), email: fuzzysort.prepare('testko2'), type: 'User', id: '0003' },
        { name: fuzzysort.prepare('notin'), email: fuzzysort.prepare('notin'), type: 'User', id: '0004' },
      ]
      const priorities = new Set([
        '0001',
      ])

      const tests = [
        { name: 'match not good enough for non-prioritized items', query: 'te', expected: { length: 1, id: '0001' } },
        { name: 'include good matches', query: 'testk', expected: { length: 3 } },
        { name: 'no priority matches, continue with regular items', query: 'not', expected: { length: 1, id: '0004' } },
      ]

      for (const t of tests) {
        const ss = getMatches({ items, priorities, query: t.query })
        expect(ss, t.name).to.have.length(t.expected.length)
        if (t.expected.id) {
          expect(ss[0].id, t.name).to.eq(t.expected.id)
        }
      }
    })
  })
})
