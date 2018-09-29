import Vue from 'vue'
import VueChatScroll from 'vue-chat-scroll'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faAngleDown, faBell, faPlusCircle, faStar, faUser, faThumbtack, faEdit, faCog, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faAngleDown,
  faBell,
  faPlusCircle,
  faStar,
  faUser,
  faThumbtack,
  faEdit,
  faCog,
  faInfoCircle
)
Vue.use(VueChatScroll)
