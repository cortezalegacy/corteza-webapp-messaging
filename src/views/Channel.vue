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
        :scroll-to-message="messageID"
        :consecutive="true"
        :lastReadMessageID="unread.lastMessageID"
        :editLastMessage="editLastMessage"
        :readOnly="!channel.canSendMessages"
        :suggestionPriorities="getSp"
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
        :show-mark-as-unread-button="(unread.count || 0) + (unread.threadCount || 0) > 0"
        :draft.sync="draft"
        :suggestionPriorities="getSp"
        @markAsRead="onMarkAsRead"
        @promptFilePicker="onPromptFilePicker"
        @editLastMessage="editLastMessage=true" />
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import ChannelHeader from 'corteza-webapp-messaging/src/components/Channel/Header'
import MessageInput from 'corteza-webapp-messaging/src/components/MessageInput'
import Upload from 'corteza-webapp-messaging/src/components/MessageInput/Upload'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import mixinUnread from 'corteza-webapp-messaging/src/mixins/unread'
import mixinUpload from 'corteza-webapp-messaging/src/mixins/upload'
import { messagesLoad } from 'corteza-webapp-messaging/src/lib/messenger'
import Delta from 'quill-delta'

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
      findWhereMember: 'channels/findWhereMember',
    }),

    getSp () {
      return {
        User: new Set((this.channel || {}).members || []),
        Channel: new Set(this.findWhereMember(this.$auth.user.userID, true).map(({ channelID }) => channelID)),
      }
    },

    draft: {
      get () {
        const d = this.$drafts.get({ channelID: this.channelID })
        if (d) {
          return new Delta(d)
        }
        return d
      },

      set ({ dest, value }) {
        if (dest.remove) {
          this.$drafts.remove(dest)
        } else {
          this.$drafts.set(dest, value)
        }
      },
    },

    messages () {
      return this.channelHistory(this.channel.channelID)
    },

    // Serves as a helper for unread procedures
    lastMessage () {
      return this.messages.length ? this.messages[this.messages.length - 1] : null
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

  created () {
    this.$root.$on('wake', this.fetchNewMessages)
  },
  beforeDestroy () {
    this.$root.$off('wake', this.fetchNewMessages)
  },

  methods: {
    ...mapMutations({
      // @todo remove direct access to mutations!
      updateHistorySet: 'history/updateSet',
    }),

    ...mapActions({
      markAllAsRead: 'unread/markChannelAsRead',
      fromMessage: 'unread/fromMessage',
    }),

    onPromptFilePicker (e) {
      this.$refs.upload.openFilePicker(e)
    },

    isFollowing ({ channelID, replyTo }) {
      return document.hasFocus() && this.channel.channelID === channelID && !replyTo
    },

    loadMessages () {
      this.editLastMessage = false

      this.previousFetchFirstMessageID = null
      messagesLoad(this.$MessagingAPI, this.findUserByID, { channelID: this.channelID, fromMessageID: this.messageID }).then((mm) => {
        this.updateHistorySet(mm)

        // Process loaded messages and extract unread info
        mm.forEach(m => this.fromMessage(m))
      })
    },

    // Mark entire channel as read
    onMarkAsRead () {
      this.markAllAsRead(this.channel)
    },

    onScrollTop ({ messageID }) {
      if (this.previousFetchFirstMessageID !== messageID) {
        // Make sure we do not fetch for the same lastID
        // over and over again...
        this.previousFetchFirstMessageID = messageID

        messagesLoad(this.$MessagingAPI, this.findUserByID, { channelID: this.channelID, beforeMessageID: messageID }).then((mm) => {
          this.updateHistorySet(mm)
        })
      }
    },

    fetchNewMessages () {
      let lmID
      if (this.messages.length) {
        lmID = (this.messages[this.messages.length - 1]).messageID
      }
      // @note this will be improved when the delta endpoint arrives
      messagesLoad(this.$MessagingAPI, this.findUserByID, { channelID: this.channelID, afterMessageID: lmID }).then((mm) => {
        this.updateHistorySet(mm)
      })
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
