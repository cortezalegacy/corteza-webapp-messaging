import { Channel } from '@/types'
import { messagesProcess } from '@/lib/messanger'
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
      bgColor: '#E85568', // /src/assets/sass/_0.declare.scss -> $appred
      fontStyle: 'lighter',
    })

    this.$store.watch(
      () => this.$store.getters['unread/total'],
      (count) => {
        window.favicon.badge(count)
      },
    )

    this.$bus.$on('$ws.channel', (channel) => {
      this.$store.commit('channels/updateList', new Channel(channel))
    })

    this.$bus.$on('$ws.channelJoin', (join) => {
      this.$store.commit('channels/channelJoin', join)
    })

    this.$bus.$on('$ws.channelPart', (part) => {
      this.$store.commit('channels/channelPart', part)
    })

    let activitySet = new Set()
    const userGetter = this.$store.getters['users/findByID']

    const userRePullHandler = () => {
      this.$store.dispatch('users/load')
    }

    // Processes unique activities & resets the list
    const updateActivity = throttle(() => {
      const activities = Array.from(activitySet)
      console.debug('updateActivity', { activities })
      activitySet = new Set()

      if (activities.length) {
        // Check for existing members
        const existing = activities.filter(userID => !!userGetter(userID))

        // Update statuses
        const statuses = activities.map(userID => ({ userID, status: 'online' }))
        this.$store.commit('users/statusSet', statuses)

        // New users; pull all of them
        if (existing.length !== activities.length) {
          if (userRePullInterval) window.clearInterval(userRePullInterval)
          this.$store.dispatch('users/load').then(() => {
            userRePullInterval = window.setInterval(userRePullHandler, userRePull)
          })
        }
      }
    }, statusThrottle)

    this.$bus.$on('$ws.activity', (activity) => {
      console.debug('activity.received', { activity })

      // Ignore self
      if (this.$auth.user.ID !== activity.userID) {
        if (activity.kind !== 'disconnected') {
          activitySet.add(activity.userID)
          updateActivity()
        }

        if (activity.kind === 'disconnected' && !activity.present) {
          this.$store.commit('users/statusRemove', { userID: activity.userID, status: 'online' })
        } else if (activity.kind) {
          // Online wont have a kind; online handled by updateActivity
          this.$store.commit('users/active', [ activity ])
        }
      }
    })

    // Handles single-message updates that gets from the backend
    this.$bus.$on('$ws.message', (message) => {
      const [ msg ] = messagesProcess(this.$store.getters['users/findByID'], [message])

      if (msg.updatedAt == null && msg.deletedAt == null && msg.replies === 0) {
        if (this.$auth.user.ID !== msg.user.ID && msg.type !== 'channelEvent') {
          // Count only new mesages, no updates, no replies
          this.$store.commit('unread/inc', msg)
        }

        this.$bus.$emit('$core.newMessage', { message: msg })
      }

      if (msg.replyTo) {
        // this.$store.commit('unread/set', {
        //   channelID: c.ID,
        //   count: (c.view || {}).newMessagesCount,
        //   lastMessageID: (c.view || {}).lastMessageID,
        // })
      }
      this.$store.commit('history/updateSet', [msg])

      // Assume activity stopped
      this.$store.commit('users/inactive', { channelID: msg.channelID, userID: msg.user.ID, kind: 'typing' })
    })

    this.$bus.$on('$ws.messageReaction', ({ userID, messageID, reaction }) => {
      const msg = this.$store.getters['history/getByID'](messageID)
      if (msg) {
        this.$store.commit('history/addReaction', { msg, userID, reaction })
        this.$store.commit('history/updateSet', [msg])
      }
    })

    this.$bus.$on('$ws.messageReactionRemoved', ({ userID, messageID, reaction }) => {
      const msg = this.$store.getters['history/getByID'](messageID)
      if (msg) {
        this.$store.commit('history/removeReaction', { msg, userID, reaction })
        this.$store.commit('history/updateSet', [msg])
      }
    })

    this.$bus.$on('$ws.messagePin', ({ userID, messageID }) => {
      const msg = this.$store.getters['history/getByID'](messageID)
      if (msg) {
        this.$store.commit('history/setPin', { msg, isPinned: true })
        this.$store.commit('history/updateSet', [msg])
      }
    })

    this.$bus.$on('$ws.messagePinRemoved', ({ userID, messageID }) => {
      const msg = this.$store.getters['history/getByID'](messageID)
      if (msg) {
        this.$store.commit('history/setPin', { msg, isPinned: false })
        this.$store.commit('history/updateSet', [msg])
      }
    })

    // Handling requests for message pins
    this.$bus.$on('message.delete', ({ message }) => {
      // Response is broadcasted via WS
      this.$store.dispatch('history/delete', { channelID: message.channelID, messageID: message.ID })
    })

    // Handling requests for last read message
    this.$bus.$on('message.markAsLastRead', ({ channelID, messageID, threadID }) => {
      this.$store.dispatch('unread/markAsRead', { channelID, lastReadMessageID: messageID, threadID })
    })

    // Handling requests for message pins
    this.$bus.$on('message.pin', ({ message }) => {
      // Response is broadcasted via WS
      this.$store.dispatch('history/pin', { channelID: message.channelID, messageID: message.ID, isPinned: message.isPinned })
    })

    // Handling requests for message bookmark
    this.$bus.$on('message.bookmark', ({ message }) => {
      // API does not send bookmark notifications back via WS, so we're on our own..
      this.$store.dispatch('history/bookmark', { channelID: message.channelID, messageID: message.ID, isBookmarked: message.isBookmarked })
    })

    // Handling Message reaction requests
    this.$bus.$on('message.reaction', ({ message, reaction }) => {
      const existing = message.reactions.find(r => r.reaction === reaction)
      const ours = existing && Array.isArray(existing.userIDs) && existing.userIDs.indexOf(this.$auth.user.ID) !== -1

      if (existing && ours) {
        this.$messaging.messageReactionRemove({ channelID: message.channelID, messageID: message.ID, reaction })
      } else {
        this.$messaging.messageReactionCreate({ channelID: message.channelID, messageID: message.ID, reaction })
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
      this.$system.authCheck().catch((err) => {
        // When logout (or a problem) is detected, redirect user
        console.error(err)
        this.$router.push({ name: 'signin' })
      })
    }, autheticationRecheck)
  },

  destroyed () {
    if (userActivityInterval) window.clearInterval(userActivityInterval)
    if (userRePullInterval) window.clearInterval(userRePullInterval)
    if (autheticationRecheckInterval) window.clearInterval(autheticationRecheckInterval)
  },
}
