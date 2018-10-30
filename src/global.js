// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import './ui'
import VueTextareaAutosize from 'vue-textarea-autosize'
import VueNativeNotification from 'vue-native-notification'
import { ChannelName } from '@/components/Channel'
import { User } from '@/types'

Vue.config.productionTip = false

Vue.use(VueTextareaAutosize)
Vue.use(VueNativeNotification)


Vue.filter('userLabel', (u) => (new User(u)).Label())


Vue.component('channel-name', ChannelName)
