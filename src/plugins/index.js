import Vue from 'vue'

import VueNativeNotification from 'vue-native-notification'

import Router from 'vue-router'

import store from 'corteza-webapp-messaging/src/store'

import system from 'corteza-webapp-common/src/plugins/system'
import messaging from 'corteza-webapp-common/src/plugins/messaging'
import auth from 'corteza-webapp-common/src/plugins/auth'
import settings from 'corteza-webapp-common/src/plugins/settings'

import ws from './ws'
import bus from './bus'
import commands from './commands'
import drafts from './drafts'

const eventbus = new Vue()

Vue.use(Router)

Vue.use(VueNativeNotification)

Vue.use(messaging)
Vue.use(settings)
Vue.use(bus, { eventbus })
Vue.use(system)
Vue.use(commands, { store })
Vue.use(ws, { eventbus })
Vue.use(auth)
Vue.use(drafts)
