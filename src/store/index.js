import Vue from 'vue'
import Vuex from 'vuex'
import auth from './auth'
import messagingChannels from './messaging/channels'
import messagingUsers from './messaging/users'
import messagingUi from './messaging/ui'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    messagingChannels,
    messagingUsers,
    messagingUi,
    auth,
  },
})

export default store
