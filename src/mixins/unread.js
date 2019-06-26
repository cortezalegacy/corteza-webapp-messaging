import { mapActions } from 'vuex'

export default {
  data () {
    return {
      unreadInternal: {
        timeoutHandle: null,
        lastMessageID: null,
      },
    }
  },

  mounted () {
    this.$bus.$on('$core.newMessage', this.handleNewMessageReadStatus)
  },

  destroyed () {
    this.$bus.$off('$core.newMessage', this.handleNewMessageReadStatus)
  },

  methods: {
    ...mapActions({
      clearUnreads: 'unread/clear',
      markLastReadMessage: 'unread/mark',
      countUnreads: 'unread/count',
    }),

    // Marks new message as read if conditions are met
    //
    // handleUnreadCounting() in Messanger.vue handles general counting for received messages (all but ours)
    //
    // Here we do 2 checks and mark the message (and all before it) as read
    //  - if message is ours
    //  - if message is not ours and we're following this stream (see isFollowing())
    handleNewMessageReadStatus ({ message }) {
      if (message.type === 'channelEvent') {
        // system messages
        return
      }

      if (message.replies > 0) {
        // notification on thread message about new replies
        return
      }

      if (this.$auth.user.userID === message.userID) {
        // This is our message, make modifications to payload
        // for clearUnreads so it understands what we want to clear
        const { channelID, messageID, replyTo } = message
        if (replyTo) {
          this.clearUnreads({ channelID, messageID })
        } else {
          this.clearUnreads({ channelID, messageID: replyTo })
        }
        return
      }

      if (this.isFollowing(message)) {
        // When "following" (doc has focus, and we are looking at the stream)
        // Mark messge as read as soon as it arrives
        this.markLastReadMessage(message)
      } else {
        // When not following, increment unread counter
        this.countUnreads(message)
      }
    },

    // Mark specific message in the channel as unread
    onMarkAsUnread ({ message }) {
      if (this.unread.lastMessageID === message.messageID) {
        // toggle
        this.onMarkAsRead()
      } else {
        this.markLastReadMessage(message)
      }
    },

    // needs a lot of UX testing
    // for now, we'll stick to manual reset when channel is read
    setMessageAsReadOnFocus ({ messageID }, handler, force) {
      console.debug('setMessageAsReadOnFocus() :: in')
      if (this.unreadInternal.lastMessageID === messageID) {
        console.debug('setMessageAsReadOnFocus() :: this.unreadInternal.lastMessageID !== messageID', { lastMessageID: this.unreadInternal.lastMessageID, messageID })
        // already recorded, nothing to do.
        return
      }

      this.unreadInternal.lastMessageID = messageID

      const resetUnread = () => {
        console.debug('setMessageAsReadOnFocus() :: resetUnread()')
        handler().then(({ lastMessageID } = {}) => {
          // this.unreadInternal.lastMessageID = messageID
        })
      }

      if (force) {
        console.debug('setMessageAsReadOnFocus() :: resetUnread() :: forced reset')
        resetUnread()
        return
      }

      // Clear existing timeout
      if (this.unreadInternal.timeoutHandle !== null) {
        console.debug('setMessageAsReadOnFocus() :: clearing timeout')
        window.clearTimeout(this.unreadInternal.timeoutHandle)
      }

      //
      if (document.hasFocus()) {
        console.debug('setMessageAsReadOnFocus() :: doc has focus')
        resetUnread()
      } else {
        const resetUnreadAfterTimeout = () => {
          console.debug('setMessageAsReadOnFocus() :: setting timeout for resetUnread')
          this.unreadInternal.timeoutHandle = window.setTimeout(resetUnread, 2000)
        }

        const onFocus = () => {
          console.debug('setMessageAsReadOnFocus() :: onFocus() executed')
          resetUnreadAfterTimeout()
          window.removeEventListener('focus', onFocus)
        }

        // Remove existing listeners
        window.removeEventListener('focus', onFocus)

        console.debug('setMessageAsReadOnFocus() :: adding onFocus() listener')
        window.addEventListener('focus', onFocus)
      }
    },
  },
}
