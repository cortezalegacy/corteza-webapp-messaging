<template>
  <div class="history">
    <ul class="discussion"
      v-if="ch"
      @scroll="scrollHandler"
      ref="msgList">
      <message v-for="(msg, index) in this.messages"
        ref="message"
        :message="msg"
        :continued="isContinued(index, messages)"
        :key="msg.ID">
      </message>
      <li ref="anchor" />
    </ul>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import * as moment from 'moment'
import Message from './Message'

// Time window for continued messages in seconds
const continuedMessagesTimeWindow = (window.CrustConfig.spa.content || {}).continuedMessagesTimeWindow || 60

export default {
  data () {
    return {
      loadSuspended: false,
      previousMessageCount: -1,
      allowAutoScroll: true,
      scrollToRef: false,
      resetUnreadTimeout: null,
    }
  },


  computed: {
    ...mapGetters({
      ch: 'channels/current',
      users: 'users/list',
      user: 'auth/user',

      findUserByID: 'users/findByID',
      findChannelByID: 'channels/findByID',

      getFirstMsgId: 'history/getFirstId',
      getLastMsgId: 'history/getLastId',
      messages: 'history/get',
    }),
  },

  methods: {
    ...mapActions({
      incChannelUnreadCount: 'unread/incChannel',
      setChannelUnreadCount: 'unread/setChannel',
      ignoreChannelUnreadCount: 'unread/ignoreChannel',
      unignoreChannelUnreadCount: 'unread/unignoreChannel',
    }),

    isContinued (index, messages) {
      // Leading message...
      if (index === 0) return false

      // Messages...
      let lastMessage = messages[index - 1]
      let currentMessage = messages[index]

      // Checks -- user ID and timestamp
      let sameUser = (lastMessage.user || {}).ID === (currentMessage.user || {}).ID
      let timeSpanCheck = moment(currentMessage.createdAt).diff(moment(lastMessage.createdAt), 'seconds') <= continuedMessagesTimeWindow
      return sameUser && timeSpanCheck
    },

    isScrolledToTop (target) {
      return target ? target.scrollTop <= 0 : true
    },

    isScrolledToBottom (target) {
      return target.scrollHeight - target.scrollTop - target.clientHeight <= 0
    },

    hasScrollbar () {
      if (!this.$refs.msgList) {
        return false
      }

      return this.$refs.msgList.scrollHeight > this.$refs.msgList.clientHeight
    },

    scrollHandler (e) {
      const len = this.$refs.message.length
      if (len === 0) {
        // Do not do any auto scrolling when there are no messages
        return
      }

      let { target } = e

      this.allowAutoScroll = this.isScrolledToBottom(target)

      if (target && this.isScrolledToTop(target) && !this.loadSuspended) {
        // Suspend loading until DOM is updated
        this.loadSuspended = true

        this.$refs.msgList.scrollTop = 1

        this.$ws.olderMessages(this.ch.ID, this.getFirstMsgId)
      }

      if (target && this.isScrolledToBottom(target) && !this.loadSuspended) {
        // this.loadSuspended = true
        // this.$ws.newerMessages(this.ch.ID, undefined, this.getLastMsgId)
        this.$ws.recordChannelView(this.ch.ID, this.getLastMsgId)
      }

      if (this.allowAutoScroll) {
        this.resetUnreadAfterTimeout()
        this.ignoreChannelUnreadCount(this.ch.ID)
      } else {
        this.clearUnreadTimeout()
        this.unignoreChannelUnreadCount(this.ch.ID)
      }
    },

    resetUnreadAfterTimeout () {
      this.clearUnreadTimeout()

      this.resetUnreadTimeout = window.setTimeout(() => {
        this.setChannelUnreadCount({ ID: this.ch.ID, count: 0 })
        this.$ws.recordChannelView(this.ch.ID, this.getLastMsgId)
      }, 2000)
    },

    clearUnreadTimeout () {
      if (this.resetUnreadTimeout !== null) {
        window.clearTimeout(this.resetUnreadTimeout)
      }
    },

    channelChanged () {
      this.ignoreChannelUnreadCount(this.ch.ID)
      this.previousMessageCount = -1
      this.loadSuspended = false
      this.allowAutoScroll = true
      this.scrollToRef = false
    },
  },

  watch: {
    'ch' (newV, oldV = {}) {
      if (newV && newV.ID !== oldV.ID) {
        this.channelChanged()
      }
    },
  },

  mounted () {
    this.channelChanged()
    this.$refs.anchor.scrollIntoView()
  },

  updated () {
    this.$nextTick(() => {
      if (!this.hasScrollbar()) {
        this.resetUnreadAfterTimeout()
        this.ignoreChannelUnreadCount(this.ch.ID)
      } else if (this.allowAutoScroll) {
        this.$refs.anchor.scrollIntoView()
      }
    })

    // When length increased, remove suspension flag
    // and allow another load
    const l = this.messages.length
    if (l > this.previousMessageCount) {
      this.previousMessageCount = l

      // Remove loading suspension after a short delay
      window.setTimeout(() => { this.loadSuspended = false }, 500)
    }
  },

  components: {
    Message,
  },
}

</script>

<!-- this does not work in scoped... -->
<!-- no clue why, in any case should not break anything -->
<style>
  img
  {
    max-width: 100% !important;
    width:auto;
    max-height: 180px !important;
  }

</style>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
.discussion
{
  position:relative;
  list-style:none;
  max-height:100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding:0;
  margin:0;
}
</style>
