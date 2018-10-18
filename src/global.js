// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import './ui'
import VueTextareaAutosize from 'vue-textarea-autosize'
import VueNativeNotification from 'vue-native-notification'
import { ChannelName } from '@/components/Channel'

Vue.config.productionTip = false

Vue.use(VueTextareaAutosize)
Vue.use(VueNativeNotification)


Vue.filter('userLabel', (u) => {
  u = u || {}
  return u.name || u.username || u.handle || u.email || u.ID || 'N/A'
})


Vue.component('channel-name', ChannelName)
