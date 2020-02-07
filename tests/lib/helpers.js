import Vue from 'vue'
import { createLocalVue, shallowMount as sm, mount as rm } from '@vue/test-utils'
// import { Settings } from 'corteza-webapp-common/src/plugins/settings'
import sinon from 'sinon'

Vue.config.ignoredElements = [
  'font-awesome-icon',
  'i18next',
  // Ignore all bootstrap elements
  /^b-/,
]

export const writeableWindowLocation = ({ path: value = '/' } = {}) => Object.defineProperty(window, 'location', { writable: true, value })

const mounter = (component, { localVue = createLocalVue(), mocks = {}, stubs = [], ...options } = {}, mount) => {
  return mount(component, {
    localVue,
    stubs: ['router-view', 'router-link', ...stubs],
    directives: {
      'b-tooltip': () => {},
    },
    mocks: {
      $t: (e) => e,
      $SystemAPI: {},
      $ComposeAPI: {},
      $bus: { $on: () => {}, $emit: () => {}, $off: () => {} },
      // $Settings: new Settings(),
      $s: sinon.stub().resolves(undefined),
      $route: { query: { fullPath: '', token: undefined } },
      ...mocks,
    },
    ...options,
  })
}

export const shallowMount = (...e) => {
  return mounter(...e, sm)
}

export const fullMount = (...e) => {
  return mounter(...e, rm)
}

export default shallowMount
