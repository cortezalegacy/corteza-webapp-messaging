// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import './ui'
import './gesture'
import VueNativeNotification from 'vue-native-notification'
import ChannelLink from '@/components/Channel/Link'
import GlobalEvents from 'vue-global-events'
import UserLink from '@/components/User/Link'
import uiMixin from '@/mixins/ui'
import labelsMixin from '@/mixins/labels'

Vue.config.productionTip = false

Vue.use(VueNativeNotification)

// Vue.filter('userLabel', (u) => (new User(u)).Label())

Vue.component('global-events', GlobalEvents)
Vue.component('channel-link', ChannelLink)
Vue.component('user-link', UserLink)

Vue.mixin(uiMixin)
Vue.mixin(labelsMixin)
