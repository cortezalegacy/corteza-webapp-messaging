import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// import { faUserSecret } from '@fortawesome/free-regular-svg-icons'

import { faMapPin, faThumbtack } from '@fortawesome/free-solid-svg-icons'
import { faBookmark, faStar } from '@fortawesome/free-regular-svg-icons'

Vue.component('font-awesome-icon', FontAwesomeIcon)

library.add(
  faBookmark,
  faStar,
  faMapPin,
  faThumbtack
)
