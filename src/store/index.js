import Vue from 'vue'
import Vuex from 'vuex'
import auth from './auth'
import channels from './channels'
import users from './users'
import ui from './ui'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    channels,
    users,
    ui,
    auth,
  },
})


export default store
