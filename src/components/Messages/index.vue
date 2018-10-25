<template>
  <ul @scroll="onScrollThrottled" ref="list" :class="{scrollable:scrollable}">
    <message v-for="(msg, index) in messages"
      ref="message"
      :message="msg"
      :continued="isContinued(messages, index)"
      :currentUser="currentUser"
      :key="msg.ID"
      v-on="$listeners" />
    <li ref="anchor"></li>
  </ul>
</template>
<script>
import _ from 'lodash'
import Message from './Message'
import messages from '@/mixins/messages'

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

    // We can not just watch for updates of messages
    // sometime we need to react only when origin changes (whatever origin is)
    origin: { required: true },

    scrollable: { type: Boolean, value: true },
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
      if (this.scrollable && (this.allowAutoScroll || (isNewMessage && isOwnerOfLastMessage))) {
        this.$refs.anchor.scrollIntoView()
      }
    })

    if (isNewMessage) {
      // Store this for next lookup
      this.lastMessageID = lastMessage.ID
    }
  },

  methods: {
    originChanged () {
      this.allowAutoScroll = true
    },

    getLastEditable () {
      return this.getLastMessageByUserID(this.messages, this.currentUser.ID)
    },

    onScrollThrottled: _.throttle(function (e) { this.onScroll(e) }, 500),
    onScroll ({ target }) {
      if (!target || !this.scrollable) return

      const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 0
      const atTop = target ? target.scrollTop <= 0 : true
      // const hasScrollBar = this.$refs.list.scrollHeight > this.$refs.list.clientHeight

      this.allowAutoScroll = atBottom

      if (atTop) {
        // load more messages 'above'.
        this.$refs.list.scrollTop = 5
        this.$emit('scrollTop', { messageID: this.getFirstID(this.messages) })
      }

      if (atBottom) {
        this.$emit('scrollBottom', { messageID: this.getLastID(this.messages) })
      }
    },

    getLastMessageByUserID: (set, userID) => {
      return [...set].reverse().find(m => m.user.ID === userID)
    },
  },

  components: {
    Message,
  },

  mixins: [
    messages,
  ],
}

</script>
<style scoped lang="scss">
ul {
  padding:0;
  margin:0;
  height: calc(100vh - 140px);

  &.scrollable {
    position:relative;
    max-height:100%;
    overflow-x: hidden;
    overflow-y: auto;
  }
}

li {
  list-style: none;
}
</style>
