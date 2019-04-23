import Vue from 'vue'
import store from '@/store'
import rest from '@/plugins/rest'
import ws from '@/plugins/ws'
import bus from '@/plugins/bus'
import system from '@/plugins/system'
import commands from '@/plugins/commands'
import triggers from '@/plugins/triggers'
import logger from '@/plugins/logger'
import auth from 'crust-common.vue/src/plugins/auth'

const eventbus = new Vue()

Vue.use(logger)
Vue.use(bus, { eventbus })
Vue.use(system)
Vue.use(rest)
Vue.use(commands, { store })
Vue.use(ws, { eventbus })
Vue.use(auth)
Vue.use(triggers, {
  userByID: store.getters['users/findByID'],
  userList: store.getters['users/listOnDemand'],
  channelByID: store.getters['channels/findByID'],
  channelList: store.getters['channels/listOnDemand'],
})
