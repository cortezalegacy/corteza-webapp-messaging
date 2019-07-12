import Vue from 'vue'

import VueNativeNotification from 'vue-native-notification'

import Router from 'vue-router'

import store from 'corteza-webapp-messaging/src/store'

import system from 'corteza-webapp-common/src/plugins/system'
import messaging from 'corteza-webapp-common/src/plugins/messaging'
import auth from 'corteza-webapp-common/src/plugins/auth'

import serverEvents from './serverEvents'
import bus from './bus'
import commands from './commands'
import triggers from './triggers'
import drafts from './drafts'

const eventbus = new Vue()

Vue.use(Router)

Vue.use(VueNativeNotification)

Vue.use(messaging)
Vue.use(bus, { eventbus })
Vue.use(system)
Vue.use(commands, { store })
Vue.use(serverEvents, { eventbus })
Vue.use(auth)
Vue.use(drafts)
Vue.use(triggers, {
  userByID: store.getters['users/findByID'],
  userList: store.getters['users/listOnDemand'],
  channelByID: store.getters['channels/findByID'],
  channelList: store.getters['channels/listOnDemand'],
})
