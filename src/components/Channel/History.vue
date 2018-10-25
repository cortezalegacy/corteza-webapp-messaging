<template>
  <div class="history">
    <messages
      ref="messages"
      :messages="messages"
      :currentUser="currentUser"
      :origin="channel"
      :scrollable="true"
      @scrollTop="onScrollTop"
      @scrollBottom="onScrollBottom"
      v-on="$listeners" />
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import Messages from '@/components/Messages'
import messages from '@/mixins/messages'

export default {
  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  data () {
    return {
      resetUnreadTimeout: null,

      previousFetchFirstMessageID: null,
    }
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
      channelHistory: 'history/getByChannelID',
    }),

    messages () {
      return this.channelHistory(this.channel.ID)
    },
  },

  watch: {
    'channel' () {
      this.channelChanged()
    },
  },

  methods: {
    ...mapActions({
      incChannelUnreadCount: 'unread/incChannel',
      setChannelUnreadCount: 'unread/setChannel',
      ignoreChannelUnreadCount: 'unread/ignoreChannel',
      unignoreChannelUnreadCount: 'unread/unignoreChannel',
    }),

    resetUnreadAfterTimeout () {
      this.clearUnreadTimeout()

      this.resetUnreadTimeout = window.setTimeout(() => {
        this.setChannelUnreadCount({ ID: this.channel.ID, count: 0 })
        this.$ws.recordChannelView(this.channel.ID, this.getLastID(this.messages))
      }, 2000)
    },

    clearUnreadTimeout () {
      if (this.resetUnreadTimeout !== null) {
        window.clearTimeout(this.resetUnreadTimeout)
      }
    },

    channelChanged () {
      this.previousFetchFirstMessageID = null

      this.ignoreChannelUnreadCount(this.channel.ID)

      // Ask for new messages
      this.$ws.getMessages({ channelID: this.channel.ID })

      this.resetUnreadAfterTimeout()
    },

    onScrollTop ({ messageID }) {
      if (this.previousFetchFirstMessageID !== messageID) {
        // Make sure we do not fetch for the same lastID
        // over and over again...
        this.previousFetchFirstMessageID = messageID

        this.$ws.getMessages({
          channelID: this.channel.ID,
          lastID: messageID,
        })
      }
    },

    onScrollBottom ({ lastMessageID }) {
      this.$ws.recordChannelView(this.channel.ID, lastMessageID)
    },
  },

  mounted () {
    this.channelChanged()
  },

  components: {
    Messages,
  },

  mixins: [
    messages,
  ],
}

</script>
