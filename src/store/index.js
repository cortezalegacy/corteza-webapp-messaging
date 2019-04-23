import Vue from 'vue'
import Vuex from 'vuex'
import channels from './channels'
import users from './users'
import history from './history'
import unread from './unread'
import settings from './settings'
import suggestions from './suggestions'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    channels,
    history,
    users,
    settings,
    suggestions,
    unread,
  },
})

export default store
