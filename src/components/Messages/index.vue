<template>
  <ul @scroll="onScrollThrottled" ref="list" :class="{scrollable:scrollable}">
    <message
      v-for="(msg, index) in messages"
      ref="message"
      @cancelEditing="$emit('cancelEditing')"
      :readOnly="readOnly"
      :message="msg"
      :consecutive="consecutive && isConsecutive(messages, index)"
      :currentUser="currentUser"
      :key="msg.ID"
      :isUnread="lastReadMessageID <= msg.ID"
      :isFirstUnread="lastReadMessageID == msg.ID"
      :isFirst="index === 0"
      :showEditor="showEditor(msg)"
      :hideActions="hideActions"
      :hideReactions="hideReactions"
      :hidePinning="hidePinning"
      :hideBookmarking="hideBookmarking"
      :hideActionGoToMessage="hideActionGoToMessage"
      :hideActionOpenThread="hideActionOpenThread"
      :hideActionsMenu="hideActionsMenu"
      :isLast="index === messages.length - 1"
      v-on="$listeners" />
    <li ref="anchor"></li>
  </ul>
</template>
<script>
import _ from 'lodash'
import Message from './Message'
import { getFirstID, getLastID, isConsecutive } from '@/lib/messages'

export default {
  props: {
    currentUser: {
      type: Object,
      required: true,
    },

    messages: {
      type: Array,
      required: true,
    },

    readOnly: Boolean,

    // We can not just watch for updates of messages
    // sometime we need to react only when origin changes (whatever origin is)
    origin: { required: true },

    scrollable: { type: Boolean, value: true },

    // This will help us mark new messages
    lastReadMessageID: {
      type: String,
    },

    // Is provided message list is consecutive
    //
    // When not, we do not calculate cont
    consecutive: { type: Boolean, default: true },

    hideActions: Boolean,
    hideReactions: Boolean,
    hidePinning: Boolean,
    hideBookmarking: Boolean,
    hideActionGoToMessage: { type: Boolean, default: true },
    hideActionOpenThread: Boolean,
    hideActionsMenu: Boolean,

    // Set to true to enable edit mode for last message from currentUser
    editLastMessage: Boolean,
  },

  computed: {
    getLastEditable () {
      return this.editLastMessage && this.getLastMessageByUserID(this.messages, this.currentUser.ID)
    },

    showEditor () {
      return (message) => this.getLastEditable && this.getLastEditable.ID === message.ID
    },
  },

  data () {
    return {
      loadSuspended: false,
      allowAutoScroll: true,
      scrollToRef: false,

      // Recounts messages on each update, so we can know
      // of new messages are added
      lastMessageID: null,
    }
  },

  watch: {
    'origin' () {
      this.originChanged()
    },
  },

  mounted () {
    this.originChanged()
  },

  updated () {
    const lastMessage = this.messages.length === 0 ? null : this.messages[this.messages.length - 1]
    const isNewMessage = lastMessage && this.lastMessageID < lastMessage.ID
    const isOwnerOfLastMessage = lastMessage && lastMessage.user.ID === this.currentUser.ID

    this.$nextTick(() => {
      if (this.scrollable) {
        // When we're scrollable, we need to emit scroll* events
        if (this.allowAutoScroll || (isNewMessage && isOwnerOfLastMessage)) {
          this.$refs.anchor.scrollIntoView()
        }

        const hasScrollBar = this.$refs.list.scrollHeight > this.$refs.list.clientHeight
        if (!hasScrollBar) {
          // Emit scrollTo bottom when there is no scrollbar on message update...
          this.$emit('scrollBottom', { messageID: getLastID(this.messages) })
        }
      }
    })

    if (isNewMessage) {
      // Store this for next lookup
      this.lastMessageID = lastMessage.ID
    }
  },

  methods: {
    isConsecutive,

    originChanged () {
      this.allowAutoScroll = true
    },

    onScrollThrottled: _.throttle(function (e) { this.onScroll(e) }, 1500),
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
      return [...set].reverse().find(m => m.user.ID === userID)
    },
  },

  components: {
    Message,
  },
}

</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
ul {
  padding:0;
  margin:0;
}

li {
  list-style: none;
}

.scrollable {
  height: 100%;
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
  }
}
</style>
