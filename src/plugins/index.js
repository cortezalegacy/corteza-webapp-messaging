import Vue from 'vue'
import store from '@/store'
import rest from '@/plugins/rest'
import ws from '@/plugins/ws'
import auth from '@/plugins/auth'

Vue.use(auth, store)
Vue.use(rest, store)
Vue.use(ws)
