import { Channel } from 'corteza-webapp-messaging/src/types'
import { messagesProcess } from 'corteza-webapp-messaging/src/lib/messenger'
import Favico from 'favico.js'
import { throttle } from 'lodash'

const userActivityTTL = 1000 * 5 // microseconds
// const statusTTL = 1000 * 35 // microseconds
const statusThrottle = 1000 * 2 // microseconds
const userRePull = 1000 * 60 * 30 // microseconds -> 30min
const autheticationRecheck = 1000 * 15 * 60 // microseconds

let userActivityInterval, userRePullInterval, autheticationRecheckInterval

export default {
  beforeCreate () {
    // Fav icon notifications
    window.favicon = new Favico({
      animation: 'none',
      bgColor: '#E85568', // /src/themes/corteza-base/variables.scss -> $appred
      fontStyle: 'lighter',
    })

    window.onbeforeunload = (event) => {
      this.$bus.$emit('$core.unload')
    }

    this.$store.watch(
      () => this.$store.getters['unread/total'],
      (count) => {
        window.favicon.badge(count)
      },
    )

    this.$bus.$on('$ws.open', () => {
      this.$store.dispatch('users/loadStatuses')
    })

    this.$bus.$on('$ws.channel', (channel) => {
      this.$store.commit('channels/updateList', new Channel(channel))
    })

    this.$bus.$on('$ws.channelJoin', (join) => {
      this.$store.commit('channels/channelJoin', join)
    })

    this.$bus.$on('$ws.channelPart', (part) => {
      this.$store.commit('channels/channelPart', part)
    })

    let activeUserIDs = new Set()
    const userListGetter = this.$store.getters['users/listOnDemand']

    const userRePullHandler = () => {
      this.$store.dispatch('users/load')
    }

    const syncUserList = throttle(() => {
      const userIDs = Array.from(activeUserIDs)
      activeUserIDs.clear()

      if (userIDs.length) {
        // Check for existing members
        const users = new Set(userListGetter().map(u => u.userID))
        const existing = userIDs.filter(userID => users.has(userID))

        if (existing.length !== userIDs.length) {
          // New users; pull all of them
          if (userRePullInterval) window.clearInterval(userRePullInterval)
          this.$store.dispatch('users/load').then(() => {
            userRePullInterval = window.setInterval(userRePullHandler, userRePull)
          })
        }
      }
    }, statusThrottle)

    const statusFromActivity = ({ icon, message, kind: present, userID }) => ({ icon, message, present, userID })

    this.$bus.$on('$ws.activity', (activity) => {
      // Ignore self
      if (this.$auth.user.userID !== activity.userID) {
        if (activity.kind === 'connected') {
          this.$store.commit('users/statusSet', [ { ...statusFromActivity(activity), present: 'online' } ])
        } else if (activity.kind === 'disconnected' && !activity.present) {
          this.$store.commit('users/statusRemove', [ { ...statusFromActivity(activity), present: 'online' } ])
        } else if (activity.kind) {
          this.$store.commit('users/active', [ activity ])
        }

        activeUserIDs.add(activity.userID)
        syncUserList()
      }
    })

    // Handles single-message updates that gets from the backend
    this.$bus.$on('$ws.message', (message) => {
      const [ msg ] = messagesProcess(this.$store.getters['users/findByID'], [message])

      this.$bus.$emit('$core.newMessage', { message: msg })
      this.$store.commit('history/updateSet', [msg])

      // Assume activity stopped
      this.$store.commit('users/inactive', { channelID: msg.channelID, userID: msg.userID, kind: 'typing' })
    })

    this.$bus.$on('$ws.messageReaction', ({ userID, messageID, reaction }) => {
      this.$store.dispatch('history/reactionAdded', { userID, messageID, reaction })
    })

    this.$bus.$on('$ws.messageReactionRemoved', ({ userID, messageID, reaction }) => {
      this.$store.dispatch('history/reactionRemoved', { userID, messageID, reaction })
    })

    this.$bus.$on('$ws.messagePin', ({ messageID }) => {
      this.$store.dispatch('history/pinned', { messageID })
    })

    this.$bus.$on('$ws.unread', (unread) => {
      this.$bus.$emit('$core.newUnreadCount', { unread })
    })

    this.$bus.$on('$ws.messagePinRemoved', ({ messageID }) => {
      this.$store.commit('history/unpinned', { messageID })
    })

    // Handling Message reaction requests
    this.$bus.$on('message.reaction', ({ message, reaction }) => {
      const existing = message.reactions.find(r => r.reaction === reaction)
      const ours = existing && Array.isArray(existing.userIDs) && existing.userIDs.indexOf(this.$auth.user.userID) !== -1

      if (existing && ours) {
        this.$MessagingAPI.messageReactionRemove({ ...message, reaction })
      } else {
        this.$MessagingAPI.messageReactionCreate({ ...message, reaction })
      }
    })

    // Activity cleanup interval
    userActivityInterval = window.setInterval(() => {
      this.$store.commit('users/cleanup', { ttl: userActivityTTL })
    }, userActivityTTL)

    // User re pull interval; handles cases where user has updated there profile
    userRePullInterval = window.setInterval(userRePullHandler, userRePull)

    // Activity cleanup interval
    autheticationRecheckInterval = window.setInterval(() => {
      this.$SystemAPI.authCheck().catch((err) => {
        // When logout (or a problem) is detected, redirect user
        console.error(err)
        this.$router.push({ name: 'signin' })
      })
    }, autheticationRecheck)
  },

  destroyed () {
    // Remove all events
    this.$bus.$off()

    // Remove all intervals
    if (userActivityInterval) window.clearInterval(userActivityInterval)
    if (userRePullInterval) window.clearInterval(userRePullInterval)
    if (autheticationRecheckInterval) window.clearInterval(autheticationRecheckInterval)
  },
}
