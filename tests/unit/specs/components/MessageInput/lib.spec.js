/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import {
  getDraft,
  stringifyDocument,
  parseDocument,
} from 'corteza-webapp-messaging/src/components/MessageInput/lib'

describe('src/components/MessageInput/lib', () => {
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
                  { type: 'mention-@', attrs: { id: '111', label: 'Mention User' } },
                  { type: 'text', text: ' text' },
                ],
              },
            ]
          },
          expected: `text <@111> text`,
        },

        {
          name: 'channel mentions',
          doc: {
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'text ' },
                  { type: 'mention-#', attrs: { id: '222', label: 'Mention Channel' } },
                  { type: 'text', text: ' text' },
                ],
              },
            ]
          },
          expected: `text <#222> text`,
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
                  { type: 'mention-@', attrs: { id: '111', label: 'Mention User' } },
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
                  { type: 'mention-#', attrs: { id: '222', label: 'Mention Channel' } },
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
})
