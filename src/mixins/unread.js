export default {
  mounted () {
    this.unreadInternal = {
      timeoutHandle: null,
      lastMessageID: null,
    }
  },

  methods: {
    // Resets unread when document/window has focus
    //
    // If document has focus, callback is executed immediately
    // otherwise an event handler is set for focus event on window obj
    resetUnreadOnFocus ({ channelID, messageID } = {}) {
      if (!channelID) {
        return
      }

      if (this.unreadInternal.lastMessageID === messageID && messageID !== undefined) {
        // already recorded, nothing to do.
        return
      }

      this.unreadInternal.lastMessageID = messageID

      const resetUnread = () => {
        this.$store.dispatch('channels/markLastReadMessage', { channelID, messageID })
      }

      // Clear existing timeout
      if (this.unreadInternal.timeoutHandle !== null) {
        window.clearTimeout(this.unreadInternal.timeoutHandle)
      }

      const resetUnreadAfterTimeout = () => {
        this.unreadInternal.timeoutHandle = window.setTimeout(resetUnread, 2000)
      }

      //
      if (document.hasFocus()) {
        resetUnread()
      } else {
        const onFocus = () => {
          resetUnreadAfterTimeout()
          window.removeEventListener('focus', onFocus)
        }

        window.addEventListener('focus', onFocus)
      }
    },

    // Will reset channel (or thread) as read
    // onMarkAsRead (o) {
    //   this.recordUnreadReset(o)
    // },

    // recordUnreadReset ({ lastReadMessageID = '0' } = {}) {
    //   const payload = { lastReadMessageID, ...this.unreadResetPayload() }
    //
    //   if (!payload.threadID) delete payload.threadID
    //
    //   // Remember lastMessageID so that we do not
    //   // bother the API if nothing changed
    //   this.unreadInternal.lastMessageID = lastReadMessageID
    //
    //   // Tell the backend we've read it all..
    //   console.log('mixinUnread.recordUnreadReset()', payload)
    //   this.$bus.$emit('message.markAsLastRead', payload)
    // },

    // unreadResetPayload () {
    //   // This method should be overridden in component that includes the mixin.
    //   console.warn('No unread reset recording (recordUnreadReset()) method found on component')
    //   return undefined
    // },
  },
}
