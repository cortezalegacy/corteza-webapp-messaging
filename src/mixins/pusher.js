import users from './users'
import { cleanMentions } from 'corteza-webapp-messaging/src/lib/mentions'

/**
 * Provides a state that is able to work with notifications.
 */
export default {
  mixins: [
    users,
  ],

  created () {
    this.$bus.$on('$core.newMessage', this.handleNotifications)
  },
  beforeDestroy () {
    this.$bus.$off('$core.newMessage', this.handleNotifications)
  },

  methods: {
    /**
     * Handles new messages and creates notifications, if so needed
     * @param {Message} message Message to process
     * @returns {Promise<*>}
     */
    async handleNotifications (message) {
      if (!this.$s('UI.BrowserNotifications.Enabled', true)) {
        // Ignoring if not allowed
        return
      }

      if (message.updatedAt !== null || message.deletedAt !== null || message.replies > 0) {
        // Ignoring deletes, removals and thread-messages with reply updates
        return
      }

      if (!this.$auth.user || this.$auth.user.userID === message.userID) {
        // Ignore messages we've authored
        return
      }
      const ch = this.$store.getters['channels/findByID'](message.channelID)
      if (!ch && document.hasFocus()) {
        // We're already paying attention
        return
      }

      // Set window title so user maybe notice the action in the channel (notifications mixin)
      // @todo not very stable & consistent...
      // titleNtf.flashNew()

      if (ch.membershipFlag === 'ignored') {
        // Ignore by membership-flag
        return
      }

      if (!(ch.isGroup() && ch.isMember(this.$auth.user.userID))) {
        if (!message.isMentioned(this.$auth.user.userID)) {
          // User is not mentioned.
          // @todo this needs to be a bit more intelligent, take user's settings into account etc...
          return
        }
      }

      if (this.getSettings('mute.all')) {
        return
      }

      // Please note that this will not work on non secure domains. "http://localhost" is an exception.
      let usr = this.users[message.userID]
      if (!usr) {
        usr = await this.getUsers(message).then(users => users[message.userID])
        if (!usr) {
          return
        }
      }

      // Determine header
      // eslint-disable-next-line
      const user = usr.label
      // eslint-disable-next-line
      const channel = ch.name
      // eslint-disable-next-line
      const headerTpl = this.$s('UI.BrowserNotifications.Header', '${user.label} in ${channel.name}')
      // eslint-disable-next-line
      const header = eval('`' + headerTpl + '`')

      // Determine body
      const bodyTrim = this.$s('UI.BrowserNotifications.MessageTrim', 200)

      const body = cleanMentions(message.message, this.users, this.channels)
      this.$notification.show(
        header,
        {
          body: body.length > bodyTrim ? body.substring(0, bodyTrim) + '...' : body,
        },
        {
          onclick: () => {
            this.$router.push({ name: 'channel', params: { channelID: message.channelID } })
          },
        },
      )
    },
  },
}
