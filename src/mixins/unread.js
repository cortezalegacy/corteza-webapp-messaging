export default {
  mounted () {
    this.$unread = {
      timeoutHandle: null,
      lastMessageID: null,
    }
  },

  data () {
    return {
      resetUnreadTimeout: null,
    }
  },

  methods: {
    resetUnreadAfterTimeout (messageID) {
      this.clearUnreadTimeout()

      if (this.$unread.lastMessageID === messageID) {
        // already recorded, nothing to do.
        return
      }

      this.$unread.timeoutHandle = window.setTimeout(() => {
        this.recordUnreadReset({ messageID })
      }, 2000)
    },

    clearUnreadTimeout () {
      if (this.$unread.timeoutHandle !== null) {
        window.clearTimeout(this.$unread.timeoutHandle)
      }
    },

    onScrollBottom ({ messageID }) {
      if (document.hasFocus()) {
        this.resetUnreadAfterTimeout(messageID)
      } else {
        const resetUnreadAfterTimeoutOnFocus = () => {
          this.resetUnreadAfterTimeout(messageID)
          window.removeEventListener('focus', resetUnreadAfterTimeoutOnFocus)
        }

        window.addEventListener('focus', resetUnreadAfterTimeoutOnFocus)
      }
    },

    onMarkAsRead (o) {
      this.recordUnreadReset(o)
    },

    recordUnreadReset ({ lastReadMessageID = '0' } = {}) {
      const payload = { lastReadMessageID, ...this.unreadResetPayload() }

      if (!payload.threadID) delete payload.threadID

      // Update store, set pointer to the ast message id
      this.$store.commit('unread/set', payload)

      this.$unread.lastMessageID = lastReadMessageID

      // Tell the backend we've read it all..
      this.$bus.$emit('message.markAsLastRead', payload)
    },

    unreadResetPayload () {
      // This method should be overriden in component that includes the mixin.
      console.warn('No unread reset recording (recordUnreadReset()) method found on component')
      return undefined
    },
  },
}
