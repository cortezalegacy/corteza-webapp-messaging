/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import { shallowMount } from 'corteza-webapp-messaging/tests/lib/helpers'
import Activity from 'corteza-webapp-messaging/src/components/Chat/Footer/Activity'

describe('components/Chat/Footer/Activity', () => {
  let propsData
  beforeEach(() => {
    propsData = {
      activity: 'typing',
      limit: 2,
    }
  })

  const mountActivity = (opt) => shallowMount(Activity, {
    mocks: { getLabel: (e) => e },
    propsData,
    ...opt,
  })

  // @note these assertions are done based on i18n keys
  it('show appropriate message', () => {
    const tests = [
      { name: 'show 1 if single activity present', users: [{}], expected: 'message.activity.activityOne' },
      { name: 'show multiple if multiple activities present', users: [{}, {}], expected: 'message.activity.activityMultiple' },
      { name: 'show slice if activities overflow limit', users: [{}, {}, {}, {}], expected: 'message.activity.activityOverflow' },
    ]

    for (const t of tests) {
      propsData.users = t.users
      const wrap = mountActivity()
      expect(wrap.text()).to.eq(t.expected)
    }
  })

  it('handle empty values', () => {
    const tests = [
      { name: 'show nothing if no users provided', users: [] },
      { name: 'show nothing if nothing provided', users: undefined },
    ]

    for (const t of tests) {
      propsData.users = t.users
      const wrap = mountActivity()
      expect(wrap.text()).to.eq('')
    }
  })
})
