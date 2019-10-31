<template>
  <div
    v-if="channel"
    class="channel"
    @dragover="handleShow($event, () => showUploadArea = true)"
    @dragenter="handleShow($event, () => showUploadArea = true)"
  >
    <upload
      v-show="showUploadArea"
      ref="upload"
      :channel-i-d="channel.channelID"
      :type-supported.sync="uploadFileTypeSupported"
      @close="showUploadArea=false; uploadFileTypeSupported=true"
      @show="showUploadArea=true"
    />

    <channel-header
      :channel="channel"
      v-on="$listeners"
    />

    <div class="messages">
      <messages
        ref="messages"
        :messages="messages"
        :current-user="$auth.user"
        :origin="channel"
        :scrollable="true"
        :scroll-to-message="messageID"
        :consecutive="true"
        :last-read-message-i-d="unread.lastMessageID"
        :edit="editMessage"
        :channel="channel"
        :read-only="!channel.canSendMessages"
        :suggestion-priorities="getSp"
        @markAsUnread="onMarkAsUnread"
        @cancelEditing="onCancelEditing"
        @scrollTop="onScrollTop"
        @scrollBottom="onScrollBottom"
        @editMessage="onEditMessage"
        v-on="$listeners"
      />
    </div>

    <chat-footer
      :channel="channel"
      :has-unread="hasUnread"
      :submit-on-enter="submitOnEnter"
      :suggestion-priorities="getSp"
      @markAsRead="onMarkAsRead"
      @promptFilePicker="onPromptFilePicker"
      @editLastMessage="onEditLastMessage"
    />
  </div>
</template>
<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import ChannelHeader from 'corteza-webapp-messaging/src/components/Channel/Header'
import Upload from 'corteza-webapp-messaging/src/components/Upload'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import mixinUnread from 'corteza-webapp-messaging/src/mixins/unread'
import mixinUpload from 'corteza-webapp-messaging/src/mixins/upload'
import { messagesLoad } from 'corteza-webapp-messaging/src/lib/messenger'
import ChatFooter from 'corteza-webapp-messaging/src/components/Chat/Footer'

export default {
  components: {
    Messages,
    Upload,
    ChannelHeader,
    ChatFooter,
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
      default: undefined,
    },
  },

  data () {
    return {
      showUploadArea: false,
      uploadFileTypeSupported: true,

      // Assists with on-scroll loading
      previousFetchFirstMessageID: null,

      // Controlls what message should be edited
      editMessage: undefined,
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

    /**
     * Helper to determine if given channel has unread items.
     * @returns {Boolean}
     */
    hasUnread () {
      return (this.unread.count || 0) + (this.unread.threadCount || 0) > 0
    },

    /**
     * Helper to determine if enter should submit. If not, a send button will be visible
     * @returns {Boolean}
     */
    submitOnEnter () {
      return !this.uiEnableSubmitButton()
    },

    /**
     * Helper to determine suggestion priorities for each mentionable type.
     * @returns {Object}
     */
    getSp () {
      return {
        User: new Set((this.channel || {}).members || []),
        Channel: new Set(this.findWhereMember(this.$auth.user.userID, true).map(({ channelID }) => channelID)),
      }
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
    /**
     * Helper to cancel message editing
     */
    onCancelEditing () {
      this.editMessage = undefined
    },

    /**
     * Helper to set a given message as beeing edited
     * @param {Object} message Message to edit
     */
    onEditMessage ({ message = {} }) {
      this.editMessage = message.messageID
    },

    /**
     * Helper to set the last message as beeing edited
     */
    onEditLastMessage () {
      this.onEditMessage({ message: this.messages[this.messages.length - 1] })
    },

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
