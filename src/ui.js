import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faMapPin, faThumbtack, faSearch, faEllipsisV, faDoorOpen, faEraser } from '@fortawesome/free-solid-svg-icons'
import { faBookmark, faStar, faFileAlt, faFileWord, faFilePdf, faFilePowerpoint, faFileArchive, faFileExcel, faFileVideo, faEyeSlash, faBellSlash } from '@fortawesome/free-regular-svg-icons'

Vue.component('font-awesome-icon', FontAwesomeIcon)

library.add(
  faBookmark,
  faStar,
  faMapPin,
  faThumbtack,
  faDoorOpen,
  faSearch,
  faFileAlt,
  faFileWord,
  faFilePdf,
  faFilePowerpoint,
  faFileArchive,
  faFileExcel,
  faFileVideo,
  faEllipsisV,
  faEyeSlash,
  faEraser,
  faBellSlash,
)
