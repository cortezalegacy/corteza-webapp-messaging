// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './views/router'
import store from './store'
import { sync } from 'vuex-router-sync'
import './ui'
import VueTextareaAutosize from 'vue-textarea-autosize'
import messagingPluginRest from '@/views/Apps/Messaging/plugins/rest'
import messagingPluginWs from '@/views/Apps/Messaging/plugins/ws'
import authPluginRest from '@/views/Auth/plugins/rest'

Vue.config.productionTip = false

const unsync = sync(store, router)

Vue.use(VueTextareaAutosize)
Vue.use(authPluginRest, store)
Vue.use(messagingPluginRest, store)
Vue.use(messagingPluginWs)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  components: { App },
  template: '<App/>',
})

unsync()
