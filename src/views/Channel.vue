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
        :lastReadMessageID="unread.lastMessageID"
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
        :show-mark-as-unread-button="unread.count > 0"
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
      findUserByID: 'users/findByID',
      channelHistory: 'history/getByChannelID',
      unreadFinder: 'unread/find',
    }),

    messages () {
      return this.channelHistory(this.channel.channelID)
    },

    channel () {
      return this.channelByID(this.channelID)
    },

    isMember () {
      return this.channel.isMember(this.$auth.user.userID)
    },

    unread () {
      return this.unreadFinder(this.channel)
    },
  },

  watch: {
    channelID: {
      immediate: true,
      handler () {
        this.loadMessages()
      },
    },
  },

  methods: {
    ...mapMutations({
      // @todo remove direct access to mutations!
      updateHistorySet: 'history/updateSet',
    }),

    ...mapActions({
      clearUnreadMessages: 'unread/clear',
      setLastReadMessageID: 'unread/setLastMessageID',
      updateUnreads: 'unread/update',
    }),

    isFollowing ({ channelID, replyTo }) {
      return document.hasFocus() && this.channel.channelID === channelID && !replyTo
    },

    loadMessages () {
      this.editLastMessage = false

      this.previousFetchFirstMessageID = null

      messagesLoad(this.$MessagingAPI, this.findUserByID, { channelID: this.channelID, fromMessageID: this.messageID }).then((mm) => {
        this.updateHistorySet(mm)
        this.updateUnreads(mm)
        this.setLastReadMessageID(mm.length ? mm[mm.length - 1] : {})
      })
    },

    // Mark entire channel as read
    onMarkAsRead () {
      this.clearUnreadMessages(this.channel)
    },

    onOpenFilePicker () {
      this.$refs.upload.openFilePicker()
    },

    onScrollTop ({ messageID }) {
      if (this.previousFetchFirstMessageID !== messageID) {
        // Make sure we do not fetch for the same lastID
        // over and over again...
        this.previousFetchFirstMessageID = messageID

        messagesLoad(this.$MessagingAPI, this.findUserByID, { channelID: this.channelID, toMessageID: messageID }).then((mm) => {
          this.updateHistorySet(mm)
        })
      }
    },

    onScrollBottom () {
      // @todo bottom loading
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
