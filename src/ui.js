import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faMapPin, faThumbtack, faSearch, faEllipsisV, faDoorOpen, faEraser, faMapMarker, faStar, faTimes, faUserCog } from '@fortawesome/free-solid-svg-icons'
import { faBookmark, faFileAlt, faFileWord, faFilePdf, faFilePowerpoint, faFileArchive, faFileExcel, faFileVideo, faEyeSlash, faBellSlash, faPlusSquare } from '@fortawesome/free-regular-svg-icons'

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
  faMapMarker,
  faTimes,
  faPlusSquare,
  faUserCog
)
