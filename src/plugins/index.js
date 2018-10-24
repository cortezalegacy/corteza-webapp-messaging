import Vue from 'vue'
import store from '@/store'
import core from '@/plugins/core'
import rest from '@/plugins/rest'
import ws from '@/plugins/ws'
import bus from '@/plugins/bus'
import auth from '@/plugins/auth'
import triggers from '@/plugins/triggers'

const eventbus = new Vue()

Vue.use(core, { eventbus, store })
Vue.use(bus, { eventbus })
Vue.use(auth)
Vue.use(rest)
Vue.use(ws, { eventbus })
Vue.use(triggers, {
  userByID: store.getters['users/findByID'],
  channelByID: store.getters['channels/findByID'],
})
