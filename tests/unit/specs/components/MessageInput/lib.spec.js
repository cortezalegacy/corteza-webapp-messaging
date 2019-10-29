/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { getDraft } from 'corteza-webapp-messaging/src/components/MessageInput/lib'

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
})
