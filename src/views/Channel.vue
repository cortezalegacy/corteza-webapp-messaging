<template>
  <div class="channel"
    @dragover="handleShow($event, () => showUploadArea = true)"
    @dragenter="handleShow($event, () => showUploadArea = true)"
    v-if="channel">
    <upload
      v-show="showUploadArea"
      @close="showUploadArea=false; uploadFileTypeSupported=true"
      @show="showUploadArea=true"
      :channelID="channel.channelID"
      :typeSupported.sync="uploadFileTypeSupported"
      ref="upload" />

    <channel-header
      v-on="$listeners"
      :channel="channel"></channel-header>

    <div class="messages">
      <messages
        ref="messages"
        :messages="messages"
        :currentUser="$auth.user"
        :origin="channel"
        :scrollable="true"
        :consecutive="true"
        :lastReadMessageID="lastReadMessageID"
        :editLastMessage="editLastMessage"
        :readOnly="!channel.canSendMessages"
        @markAsUnread="onMarkAsUnread"
        @cancelEditing="editLastMessage=false"
        @scrollTop="onScrollTop"
        @scrollBottom="onScrollBottom"
        v-on="$listeners" />
    </div>

    <div class="footer">
      <message-input
        :channel="channel"
        :readonly="!isMember"
        :focus="uiFocusMessageInput()"
        :show-mark-as-unread-button="!!currentChannel.unread.count"
        @markAsRead="onMarkAsRead"
        @promptFilePicker="onOpenFilePicker"
        @editLastMessage="editLastMessage=true" />
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import ChannelHeader from '@/components/Channel/Header'
import MessageInput from '@/components/MessageInput'
import Upload from '@/components/MessageInput/Upload'
import Messages from '@/components/Messages'
import mixinUnread from '@/mixins/unread'
import mixinUpload from '@/mixins/upload'
import { messagesLoad } from '@/lib/messenger'

export default {
  components: {
    Messages,
    MessageInput,
    Upload,
    ChannelHeader,
  },

  mixins: [
    mixinUnread,
    mixinUpload,
  ],

  props: {
    channelID: {
      type: String,
      required: true,
    },

    messageID: {
      // go-to-message will fill this prop.
      type: String,
    },
  },

  data () {
    return {
      showUploadArea: false,
      uploadFileTypeSupported: true,

      channel: null,

      // Assists with on-scroll loading
      previousFetchFirstMessageID: null,

      // Controls if last message in the list
      // should be have editing enabled or not
      editLastMessage: false,
    }
  },

  computed: {
    ...mapGetters({
      channelByID: 'channels/findByID',
      channelHistory: 'history/getByChannelID',
    }),

    messages () {
      return this.channelHistory(this.channel.channelID)
    },

    currentChannel () {
      return this.channelByID(this.channelID)
    },

    isMember () {
      return this.channel.isMember(this.$auth.user.userID)
    },

    lastReadMessageID () {
      return this.currentChannel.unread.count ? this.currentChannel.unread.lastMessageID : null
    },

    following () {
      // @todo add check if scrolled to bottom!
      return document.hasFocus()
    },
  },

  watch: {
    channelID () {
      this.changeChannel(this.currentChannel)
    },
  },

  created () {
    let c = this.currentChannel
    if (!c) return

    this.changeChannel(c)
  },

  mounted () {
    this.$bus.$on('$core.newMessage', this.handleUnread)
  },

  destroyed () {
    this.$bus.$off('$core.newMessage', this.handleUnread)
  },

  methods: {
    ...mapMutations({ // @todo remove direct access to mutations!
      clearHistory: 'history/clearSet',
    }),
    ...mapActions({
      markLastReadMessage: 'channels/markLastReadMessage',
    }),

    changeChannel (channel) {
      if (!channel) return

      this.editLastMessage = false
      this.channel = channel

      this.$store.commit('channels/setCurrent', this.channel)

      this.previousFetchFirstMessageID = null

      // @todo <fromID> does not work as expected
      // need to rewire message fetching via rest and react
      // after response is actually received
      messagesLoad(this.$MessagingAPI, this.$store.getters['users/findByID'], { channelID: this.channel.channelID, fromMessageID: this.messageID }).then((msgs) => {
        this.$store.commit('history/updateSet', msgs)
      })
    },

    // Mark entire channel as read
    onMarkAsRead () {
      this.markLastReadMessage({ channelID: this.channelID })
    },

    // Mark specific message in the channel as unread
    onMarkAsUnread ({ message }) {
      if (this.lastReadMessageID === message.messageID) {
        this.markLastReadMessage({ channelID: this.channelID })
      } else {
        this.markLastReadMessage(message)
      }
    },

    onOpenFilePicker () {
      this.$refs.upload.openFilePicker()
    },

    onScrollTop ({ messageID }) {
      if (this.previousFetchFirstMessageID !== messageID) {
        // Make sure we do not fetch for the same lastID
        // over and over again...
        this.previousFetchFirstMessageID = messageID

        messagesLoad(this.$MessagingAPI, this.$store.getters['users/findByID'], { channelID: this.channel.channelID, toMessageID: messageID }).then((msgs) => {
          this.$store.commit('history/updateSet', msgs)
        })
      }
    },

    onScrollBottom () {
      this.resetUnreadOnFocus({ channelID: this.channel.channelID })
    },

    // // Prepares payload for unread resetting
    // unreadResetPayload () {
    //   const { channelID } = this.channel
    //   return { channelID }
    // },

    //
    handleUnread ({ message }) {
      if (!this.currentChannel) {
        return
      }

      // If user does not have any existing unread info (lastMessageID <> null)
      // skip extra checks and mark message as unread
      console.log(this.currentChannel.unread.lastMessageID)
      if (this.currentChannel.unread.lastMessageID !== null) {
        // Is user observing list of messages where this message will land
        if (!this.following) {
          // Not focus, no update
          return
        }

        if (!this.channel.channelID === message.channelID) {
          // Not in the current channel, no update
          return
        }
      }

      this.markLastReadMessage(message)
    },
  },
}
</script>
<style lang="scss" scoped>
.channel {
  display: flex;
  flex-flow: column nowrap;
  height: 100vh;
  position: relative;

  & > div.messages {
    flex: 1 100%;
    overflow-y: auto; //to avoid double scroll on linux
  }
}
</style>
