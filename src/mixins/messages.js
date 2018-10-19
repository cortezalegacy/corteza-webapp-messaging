import * as moment from 'moment'

// Time window for continued messages in seconds
const continuedMessagesTimeWindow = (window.CrustConfig.spa.content || {}).continuedMessagesTimeWindow || 60

export default {
  methods: {
    getFirstID: (set) => (set[0] || {}).ID,
    getLastID: (set, ID) => (set[set.length - 1] || {}).ID,
    getLastMessageByUserID: (set, userID) => set.reverse().find(m => m.user.ID === userID),

    isContinued: (set, index = 0) => {
      // Leading message...
      if (index === 0 || set.length === 0 || set.length < index) return false

      // Previous message
      let pm = set[index - 1]

      // Current message
      let cm = set[index]

      if (!pm || !cm) return false

      // Checks -- user ID and timestamp
      let sameUser = (pm.user || {}).ID === (cm.user || {}).ID
      let timeSpanCheck = moment(cm.createdAt).diff(moment(pm.createdAt), 'seconds') <= continuedMessagesTimeWindow
      return sameUser && timeSpanCheck
    },
  },
}
