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
    resetUnreadAfterTimeout (lastMessageID) {
      this.clearUnreadTimeout()

      if (this.$unread.lastMessageID === lastMessageID) {
        // already recorded, nothing to do.
        return
      }

      this.$unread.lastMessageID = lastMessageID

      this.$unread.timeoutHandle = window.setTimeout(() => {
        this.recordUnreadReset({ lastMessageID })
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

    recordUnreadReset ({ lastMessageID = 0 }) {
      const payload = Object.assign({}, { lastMessageID }, this.unreadResetPayload())

      // Update store, set pointer to the ast message id
      this.$store.commit('unread/set', payload)

      // Tell the backend we've read it all..
      this.$ws.setUnread(payload)
    },

    unreadResetPayload () {
      // This method should be overriden in component that includes the mixin.
      console.warn('No unread reset recording (recordUnreadReset()) method found on component')
      return undefined
    },
  },
}
