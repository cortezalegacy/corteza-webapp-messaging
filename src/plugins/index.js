import Vue from 'vue'
import store from '@/store'
import rest from '@/plugins/rest'
import ws from '@/plugins/ws'
import auth from '@/plugins/auth'
import triggers from '@/plugins/triggers'

Vue.use(auth)
Vue.use(rest)
Vue.use(ws)
Vue.use(triggers, {
  userByID: store.getters['users/findByID'],
  channelByID: store.getters['channels/findByID'],
})
