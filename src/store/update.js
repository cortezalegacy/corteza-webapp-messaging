import Messaging from '@/api/messaging'
import System from '@/api/system'

export default function (Vue, store) {
  // Update state api providers
  Vue.$store.commit('channels/updateApi', ({ Messaging }))
  Vue.$store.commit('history/updateApi', ({ Messaging }))
  Vue.$store.commit('users/updateApi', ({ Messaging, System }))
  Vue.$store.commit('settings/updateApi', ({ Messaging }))
  Vue.$store.commit('suggestions/updateApi', ({ Messaging }))
  Vue.$store.commit('unread/updateApi', ({ Messaging }))
}
