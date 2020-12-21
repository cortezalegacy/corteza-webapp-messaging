import Vue from 'vue'
import VueNativeNotification from 'vue-native-notification'
import Router from 'vue-router'
import VueProgressBar from 'vue-progressbar'
import vars from '../themes/corteza-base/variables.scss'

import store from 'corteza-webapp-messaging/src/store'

import { plugins } from '@cortezaproject/corteza-vue'

import ws from './ws'
import bus from './bus'
import commands from './commands'
import drafts from './drafts'

const eventbus = new Vue()

Vue.use(Router)
Vue.use(VueNativeNotification)
Vue.use(VueProgressBar, {
  color: vars.primary,
  failedColor: vars.danger,
  thickness: '7px',
})

Vue.use(plugins.CortezaAPI('system'))
Vue.use(plugins.CortezaAPI('messaging'))

Vue.use(plugins.Auth(), { api: Vue.prototype.$SystemAPI })
Vue.use(plugins.Settings, { api: Vue.prototype.$SystemAPI })

Vue.use(bus, { eventbus })
Vue.use(commands, { store })
Vue.use(ws, { eventbus })
Vue.use(drafts)
