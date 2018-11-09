import moment from 'moment'

// Time window for consecutive messages in seconds
const consecutiveMessagesTimeWindow = (window.CrustConfig.spa.content || {}).consecutiveMessagesTimeWindow || 3 * 60

export function getFirstID (set) {
  return (set[0] || {}).ID
}

export function getLastID (set, ID) {
  return (set[set.length - 1] || {}).ID
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

  if ((pm.user || {}).ID !== (cm.user || {}).ID) {
    // Different user
    return false
  }

  // Time span check
  return moment(cm.createdAt).diff(moment(pm.createdAt), 'seconds') <= consecutiveMessagesTimeWindow
}
