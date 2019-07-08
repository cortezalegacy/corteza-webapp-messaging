import Vue from 'vue'
import Vuex from 'vuex'

import SystemAPI from 'corteza-webapp-common/src/lib/corteza-server/system'
import MessagingAPI from 'corteza-webapp-common/src/lib/corteza-server/messaging'

import channels from './channels'
import users from './users'
import history from './history'
import unread from './unread'
import settings from './settings'
import suggestions from './suggestions'
import session from './session'

Vue.use(Vuex)

const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  modules: {
    channels: channels(MessagingAPI),
    history: history(MessagingAPI),
    users: users(MessagingAPI, SystemAPI),
    settings: settings(MessagingAPI),
    suggestions: suggestions(MessagingAPI),
    unread: unread(MessagingAPI),
    session: session(MessagingAPI),
  },
})

export default store
