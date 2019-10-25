<template>
  <ul
    ref="list"
    :class="{scrollable:scrollable}"
    @scroll="onScrollThrottled"
    @click="$bus.$emit('ui.closeEmojiPicker')"
  >
    <message
      v-for="(msg, index) in messages"
      ref="message"
      :key="msg.messageID"
      :read-only="readOnly"
      :message="msg"
      :consecutive="consecutive && isConsecutive(messages, index)"
      :current-user="currentUser"
      :is-unread="!!lastReadMessageID && lastReadMessageID < msg.messageID"
      :is-last-read="lastReadMessageID === msg.messageID"
      :is-first="index === 0"
      :show-editor="showEditor(msg)"
      :hide-actions="hideActions"
      :hide-reactions="hideReactions"
      :hide-mark-as-unread="hideMarkAsUnread || index === messages.length - 1 || index === 0"
      :hide-pinning="hidePinning"
      :hide-bookmarking="hideBookmarking"
      :hide-action-go-to-message="hideActionGoToMessage"
      :hide-action-open-thread="hideActionOpenThread"
      :hide-actions-menu="hideActionsMenu"
      :hide-replies="hideReplies"
      :is-last="index === messages.length - 1"
      :highlight-pinned="highlightPinned"
      :highlight-bookmarked="highlightBookmarked"
      :suggestion-priorities="suggestionPriorities"
      @cancelEditing="$emit('cancelEditing')"
      v-on="$listeners"
    />
    <li ref="anchor" />
  </ul>
</template>
<script>
import { throttle } from 'lodash'
import Message from './Message'
import { getFirstID, getLastID, isConsecutive } from 'corteza-webapp-messaging/src/lib/messages'

export default {
  components: {
    Message,
  },

  props: {
    currentUser: {
      type: Object,
      required: true,
    },

    messages: {
      type: Array,
      required: true,
    },

    suggestionPriorities: {
      type: Object,
      default: () => ({}),
    },

    readOnly: Boolean,

    // We can not just watch for updates of messages
    // sometime we need to react only when origin changes (whatever origin is)
    origin: {
      type: Object,
      required: true,
      default: undefined,
    },

    scrollable: {
      type: Boolean,
      default: true,
    },

    // When set, we scroll to that message
    scrollToMessage: {
      type: String,
      default: undefined,
    },

    // This will help us mark new messages
    lastReadMessageID: {
      type: String,
      default: undefined,
    },

    // Is provided message list is consecutive
    //
    // When not, we do not calculate cont
    consecutive: { type: Boolean, default: true },

    hideActions: Boolean,
    hideMarkAsUnread: Boolean,
    hideReactions: Boolean,
    hidePinning: Boolean,
    hideBookmarking: Boolean,
    hideActionGoToMessage: { type: Boolean, default: true },
    hideActionOpenThread: Boolean,
    hideActionsMenu: Boolean,
    hideReplies: Boolean,

    // Set to true to enable edit mode for last message from currentUser
    editLastMessage: Boolean,

    // Controling bookmarked and pinned messages highlighting
    highlightBookmarked: { type: Boolean, default: true },
    highlightPinned: { type: Boolean, default: true },
  },

  data () {
    return {
      loadSuspended: false,
      allowAutoScroll: true,
      scrollToRef: false,

      scrolledToMessage: false,

      // Recounts messages on each update, so we can know
      // of new messages are added
      lastMessageID: null,
    }
  },

  computed: {
    getLastEditable () {
      return this.editLastMessage && this.getLastMessageByUserID(this.messages, this.currentUser.userID)
    },

    showEditor () {
      return ({ messageID }) => this.getLastEditable && this.getLastEditable.messageID === messageID
    },
  },

  watch: {
    'origin' () {
      this.originChanged()
    },

    scrollToMessage () {
      this.scrolledToMessage = false
    },
  },

  mounted () {
    this.originChanged()

    window.addEventListener('keyboardDidShow', this.onKeyboardDidShow)
  },

  beforeDestroy () {
    window.removeEventListener('keyboardDidShow', this.onKeyboardDidShow)
  },

  updated () {
    const lastMessage = this.messages.length === 0 ? null : this.messages[this.messages.length - 1]
    const isNewMessage = lastMessage && this.lastMessageID < lastMessage.messageID
    const isOwnerOfLastMessage = lastMessage && lastMessage.userID === this.currentUser.userID

    this.$nextTick(() => {
      if (this.scrollable) {
        if (this.scrollToMessage && !this.scrolledToMessage) {
          // Someone wanted to get to the very specific message (via search probably
          const refMessage = this.$refs.message.find(({ message }) => message.messageID === this.scrollToMessage)

          if (refMessage && refMessage.$el) {
            // when message is present, scroll it into view
            refMessage.$el.scrollIntoView()
            window.setTimeout(() => {
              // delay setting scrolledToMessage flag for 5 seconds
              // to prevent auto-scroller to kick in too soon
              this.scrolledToMessage = true
            }, 5 * 1000)
          }
        } else if (this.allowAutoScroll || (isNewMessage && isOwnerOfLastMessage)) {
          this.$refs.anchor.scrollIntoView()
        }

        const hasScrollBar = this.$refs.list.scrollHeight > this.$refs.list.clientHeight
        if (!hasScrollBar && isNewMessage) {
          // Emit scrollTo bottom when there is no scrollbar on message update...
          this.$emit('scrollBottom', { messageID: getLastID(this.messages) })
        }
      }
    })

    if (isNewMessage) {
      // Store this for next lookup
      this.lastMessageID = lastMessage.messageID
    }
  },

  methods: {
    isConsecutive,

    onKeyboardDidShow (e) {
      this.$refs.list.scrollTop += e.keyboardHeight
    },

    originChanged () {
      this.allowAutoScroll = true
      this.scrolledToMessage = false
    },

    onScrollThrottled: throttle(function (e) { this.onScroll(e) }, 1500),
    onScroll ({ target }) {
      if (!target || !this.scrollable) return

      const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 0
      const atTop = target ? target.scrollTop <= 0 : true

      this.allowAutoScroll = atBottom

      if (atTop && this.$refs.list) {
        // load more messages 'above'.
        this.$refs.list.scrollTop = 5
        this.$emit('scrollTop', { messageID: getFirstID(this.messages) })
      }

      if (atBottom) {
        this.$emit('scrollBottom', { messageID: getLastID(this.messages) })
      }
    },

    getLastMessageByUserID: (set, userID) => {
      return [...set].reverse().find(m => m.userID === userID)
    },
  },
}

</script>
<style scoped lang="scss">
ul {
  padding:0;
  margin:0;
}

li {
  list-style: none;
}

.scrollable {
  height: calc(100vh - 90px);
  overflow-x: hidden;
  overflow-y: scroll;
}

//media query specific for webkit, because of fixed and vh related problem in android/webkit
@media (max-width: #{$wideminwidth - 1px})
{
  .scrollable {
    //@support for webkit only
    @supports (-webkit-appearance:none) {
      //see : https://developers.google.com/web/updates/2016/12/url-bar-resizing
      //and : https://dev.to/peiche/100vh-behavior-on-chrome-2hm8
      //bottom:50px;
      //background-color:blue;
    }
  }
}
@media (min-width: $wideminwidth)
{
  .scrollable {
    height: calc(100vh - 135px);
  }
}
</style>
