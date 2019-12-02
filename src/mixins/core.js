import { Channel, Message } from 'corteza-webapp-messaging/src/types'
import Favico from 'favico.js'

const autheticationRecheck = 1000 * 15 * 60 // microseconds

let autheticationRecheckInterval

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

    this.$bus.$on('$ws.channel', (channel) => {
      this.$store.commit('channels/updateList', new Channel(channel))
    })

    this.$bus.$on('$ws.channelJoin', (join) => {
      this.$store.commit('channels/channelJoin', join)
    })

    this.$bus.$on('$ws.channelPart', (part) => {
      this.$store.commit('channels/channelPart', { ...part, cUser: this.$auth.user })
    })

    this.$bus.$on('$ws.activity', (activity) => {
      if (this.$auth.user.userID !== activity.userID) {
        this.$bus.$emit('user.activity', activity)
      }
    })

    // Handles single-message updates that gets from the backend
    this.$bus.$on('$ws.message', (message) => {
      this.$bus.$emit('$core.newMessage', new Message(message))
    })

    this.$bus.$on('$ws.messageReaction', ({ userID, messageID, reaction }) => {
      this.$bus.$emit('message.reaction', { userID, messageID, reaction, add: true })
    })

    this.$bus.$on('$ws.messageReactionRemoved', ({ userID, messageID, reaction }) => {
      this.$bus.$emit('message.reaction', { userID, messageID, reaction, add: false })
    })

    this.$bus.$on('$ws.messagePin', ({ messageID, channelID }) => {
      // isPinned is flipped, since mixin is defined to work with this
      this.$bus.$emit('message.pin', { messageID, channelID, isPinned: false })
    })

    this.$bus.$on('$ws.unread', (unread) => {
      this.$bus.$emit('$core.newUnreadCount', { unread })
    })

    this.$bus.$on('$ws.messagePinRemoved', ({ messageID, channelID }) => {
      // isPinned is flipped, since mixin is defined to work with this
      this.$bus.$emit('message.pin', { messageID, channelID, isPinned: true })
    })

    autheticationRecheckInterval = window.setInterval(() => {
      this.$SystemAPI.authCheck().catch((err) => {
        // When logout (or a problem) is detected, redirect user
        console.error(err)
        this.$router.push({ name: 'signin' })
      })
    }, autheticationRecheck)
  },

  mounted () {
    this.$nextTick(() => {
      window.addEventListener('resize', () => {
        this.$store.commit('ui/update', window)
      })
      this.$store.commit('ui/update', window)
    })
  },

  destroyed () {
    // Remove all events
    this.$bus.$off()

    // Remove all intervals
    if (autheticationRecheckInterval) window.clearInterval(autheticationRecheckInterval)
  },
}
