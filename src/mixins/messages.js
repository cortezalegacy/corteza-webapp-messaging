import moment from 'moment'

// Time window for continued messages in seconds
const continuedMessagesTimeWindow = (window.CrustConfig.spa.content || {}).continuedMessagesTimeWindow || 3 * 60

export default {
  methods: {
    getFirstID: (set) => (set[0] || {}).ID,
    getLastID: (set, ID) => (set[set.length - 1] || {}).ID,

    isContinued: (set, index = 0) => {
      // Leading message...
      if (index === 0 || set.length === 0 || set.length < index) return false

      // Previous message
      let pm = set[index - 1]

      // Current message
      let cm = set[index]

      if (!pm || !cm) return false

      if (pm.channelID !== cm.channelID) {
        // Different channel, this happens in search results only...
        return false
      }

      if ((pm.user || {}).ID !== (cm.user || {}).ID) {
        // Different user
        return false
      }

      // Time span check
      return moment(cm.createdAt).diff(moment(pm.createdAt), 'seconds') <= continuedMessagesTimeWindow
    },
  },
}
