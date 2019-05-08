import moment from 'moment'

// Time window for consecutive messages in seconds
const consecutiveMessagesTimeWindow = 3 * 60 // 3 minutes

export function getFirstID (set) {
  return (set[0] || {}).messageID
}

export function getLastID (set, ID) {
  return (set[set.length - 1] || {}).messageID
}

export function isConsecutive (set, index = 0) {
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

  if ((pm.user || {}).userID !== (cm.user || {}).userID) {
    // Different user
    return false
  }

  // Time span check
  return moment(cm.createdAt).diff(moment(pm.createdAt), 'seconds') <= consecutiveMessagesTimeWindow
}
