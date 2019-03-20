import Vue from 'vue'
import Vuex from 'vuex'
import Messaging from '@/api/messaging'
import channels from './channels'
import users from './users'
import history from './history'
import unread from './unread'
import settings from './settings'
import suggestions from './suggestions'

Vue.use(Vuex)

const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  modules: {
    channels: channels(Messaging),
    history: history(Messaging),
    users: users(Messaging),
    settings: settings(Messaging),
    suggestions: suggestions(Messaging),
    unread: unread(Messaging),
  },
})

export default store
