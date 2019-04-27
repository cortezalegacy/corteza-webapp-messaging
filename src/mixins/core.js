import { Channel, Message } from '@/types'
import localCommands from '@/commands'
import Favico from 'favico.js'

const userActivityTTL = 1000 * 5 // microseconds
const autheticationRecheck = 1000 * 15 * 60 // microseconds

let userActivityInterval
let autheticationRecheckInterval

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
      this.$store.mutate('channels/updateList', new Channel(channel))
    })

    this.$bus.$on('$ws.channelJoin', (join) => {
      this.$store.dispatch('channels/join', join)
    })

    this.$bus.$on('$ws.channelPart', (part) => {
      this.$store.dispatch('channels/part', part)
    })

    this.$bus.$on('$ws.channelActivity', (activity) => {
      if (this.$auth.user.ID !== activity.userID) {
        // Store activity only if someone else is active...
        this.$store.commit('users/active', activity)
      }
    })

    this.$bus.$on('$ws.clientConnected', ({ uid }) => {
      this.$store.commit('users/connections', { ID: uid, delta: 1 })
    })

    this.$bus.$on('$ws.clientDisconnected', ({ uid }) => {
      this.$store.commit('users/connections', { ID: uid, delta: -1 })
    })

    // Handles single-message updates that gets from the backend
    this.$bus.$on('$ws.message', (message) => {
      const msg = new Message(message)

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
      this.$store.dispatch('history/update', [msg])

      // Assume activity stopped
      this.$store.commit('users/inactive', { channelID: msg.channelID, userID: msg.user.ID, kind: 'typing' })
    })

    // This serves a sole purpose of handling callback to getMessage calls to $ws
    this.$bus.$on('$ws.messages', messages => this.$store.dispatch('history/update', messages.map(message => new Message(message))))

    this.$bus.$on('$ws.messageReaction', ({ userID, messageID, reaction }) => {
      const msg = this.$store.getters['history/getByID'](messageID)
      if (msg) {
        msg.addReaction({ userID, reaction })
        this.$store.commit('history/update', [msg])
      }
    })

    this.$bus.$on('$ws.messageReactionRemoved', ({ userID, messageID, reaction }) => {
      const msg = this.$store.getters['history/getByID'](messageID)
      if (msg) {
        msg.removeReaction({ userID, reaction })
        this.$store.commit('history/update', [msg])
      }
    })

    this.$bus.$on('$ws.messagePin', ({ userID, messageID }) => {
      const msg = this.$store.getters['history/getByID'](messageID)
      if (msg) {
        msg.isPinned = true
        this.$store.commit('history/update', [msg])
      }
    })

    this.$bus.$on('$ws.messagePinRemoved', ({ userID, messageID }) => {
      const msg = this.$store.getters['history/getByID'](messageID)
      if (msg) {
        msg.isPinned = false
        this.$store.commit('history/update', [msg])
      }
    })

    this.$bus.$on('$ws.commands', (commands) => {
      this.$store.commit('suggestions/setCommands', commands.map(c => {
        return {
          command: c.name,
          description: c.description,
          params: [],
          meta: {},
          handler: (vm, { channel, params, input }) => {
            vm.$ws.exec(channel.ID, c.name, {}, input)
          },
        }
      }).concat(localCommands))
    })

    // Handling requests for message pins
    this.$bus.$on('message.delete', ({ message }) => {
      // Response is broadcasted via WS
      this.$rest.deleteMessage(message.channelID, message.ID)
    })

    // Handling requests for last read message
    this.$bus.$on('message.markAsLastRead', ({ channelID, messageID, threadID }) => {
      this.$store.dispatch('unread/markAsRead', { channelID, lastReadMessageID: messageID, threadID })
    })

    // Handling requests for message pins
    this.$bus.$on('message.pin', ({ message }) => {
      // Response is broadcasted via WS
      this.$rest.pinMessage(message.channelID, message.ID, message.isPinned)
    })

    // Handling requests for message bookmark
    this.$bus.$on('message.bookmark', ({ message }) => {
      // API does not send bookmark notifications back via WS, so we're on our own..
      this.$rest.bookmarkMessage(message.channelID, message.ID, message.isBookmarked).then(() => {
        const msg = this.$store.getters['history/getByID'](message.ID)
        if (msg) {
          msg.isBookmarked = !msg.isBookmarked
          this.$store.commit('history/update', [msg])
        }
      })
    })

    // Handling Message reaction requests
    this.$bus.$on('message.reaction', ({ message, reaction }) => {
      const existing = message.reactions.find(r => r.reaction === reaction)
      const ours = existing && Array.isArray(existing.userIDs) && existing.userIDs.indexOf(this.$auth.user.ID) !== -1
      this.$rest.reactionToMessage(message.channelID, message.ID, reaction, existing && ours)
    })

    // Activity cleanup interval
    userActivityInterval = window.setInterval(() => {
      this.$store.commit('users/cleanup', { ttl: userActivityTTL })
    }, userActivityTTL)

    // Activity cleanup interval
    autheticationRecheckInterval = window.setInterval(() => {
      this.$system.authCheck().catch((err) => {
        // When logout (or a problem) is detected, redurect user
        console.error(err)
        this.$router.push({ name: 'signin' })
      })
    }, autheticationRecheck)
  },

  destroyed () {
    if (userActivityInterval) window.clearInterval(userActivityInterval)
    if (autheticationRecheckInterval) window.clearInterval(autheticationRecheckInterval)
  },
}
