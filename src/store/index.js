import Vue from 'vue'
import Vuex from 'vuex'
import auth from './auth'
import channels from './channels'
import users from './users'
import history from './history'
import unread from './unread'
import ui from './ui'
import suggestions from './suggestions'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    channels,
    history,
    users,
    ui,
    auth,
    suggestions,
    unread,
  },
})

export default store
