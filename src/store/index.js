import Vue from 'vue'
import Vuex from 'vuex'

import channels from './channels'
import unread from './unread'
import settings from './settings'
import suggestions from './suggestions'
import session from './session'
import ui from './ui'

import { plugins } from '@cortezaproject/corteza-vue'

Vue.use(Vuex)
Vue.use(plugins.CortezaAPI('messaging'))

const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  modules: {
    channels: channels(Vue.prototype.$MessagingAPI),
    settings: settings(Vue.prototype.$MessagingAPI),
    suggestions: suggestions(Vue.prototype.$MessagingAPI),
    unread: unread(Vue.prototype.$MessagingAPI),
    session: session(Vue.prototype.$MessagingAPI),
    ui: ui(),
  },
})

export default store
