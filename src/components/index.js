import Vue from 'vue'

import GlobalEvents from 'vue-global-events'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import './faIcons'

import ChannelLink from './Channel/Link'
import UserLink from './User/Link'

Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.component('global-events', GlobalEvents)

Vue.component('channel-link', ChannelLink)
Vue.component('user-link', UserLink)
