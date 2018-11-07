// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import './ui'
import VueNativeNotification from 'vue-native-notification'
import ChannelName from '@/components/Channel/Name'
import ChannelLink from '@/components/Channel/Link'
import GlobalEvents from 'vue-global-events'
import UserLink from '@/components/User/Link'
import { User } from '@/types'

Vue.config.productionTip = false

Vue.use(VueNativeNotification)

Vue.filter('userLabel', (u) => (new User(u)).Label())

Vue.component('global-events', GlobalEvents)
Vue.component('channel-name', ChannelName)
Vue.component('channel-link', ChannelLink)
Vue.component('user-link', UserLink)
