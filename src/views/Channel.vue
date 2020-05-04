<template>
  <div
    v-if="channel"
    class="channel"
    @dragover="handleShow($event, () => showUploadArea = true)"
    @dragenter="handleShow($event, () => showUploadArea = true)"
    @paste="onPaste"
  >
    <upload
      v-if="$s('Message.Attachments.Enabled', true)"
      v-show="showUploadArea"
      ref="upload"
      :channel-i-d="channel.channelID"
      :type-supported.sync="uploadFileTypeSupported"
      @show="showUploadArea=true"
      @close="showUploadArea=false; uploadFileTypeSupported=true"
    />

    <channel-header
      :channel="channel"
      :users="users"
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
        :highlight-message-i-d="messageID"
        :submit-on-enter="submitOnEnter"
        :edit="editMessage"
        :channel="channel"
        :read-only="!channel.canSendMessages"
        :suggestion-priorities="getSp"
        @markAsUnread="onMarkAsUnread"
        @cancelEditing="onCancelEditing"
        @scrollTop="onScrollTop"
        @scrollBottom="onScrollBottom"
        @editMessage="onEditMessage"
        @mentionSelect="onMentionSelect"
        @messageReaction="onMessageReaction"
        @bookmarkMessage="onBookmarkMessage"
        @pinMessage="onPinMessage"
        @deleteMessage="onDeleteMessage"
        v-on="$listeners"
      />
    </div>

    <chat-footer
      class="ch-footer"
      :channel="channel"
      :has-unread="hasUnread"
      :has-recent="!!messageID"
      :submit-on-enter="submitOnEnter"
      :suggestion-priorities="getSp"
      :readonly="!isMember"
      :users="users"
      @showRecent="onShowRecent"
      @markAsRead="onMarkAsRead"
      @promptFilePicker="onPromptFilePicker"
      @editLastMessage="onEditLastMessage"
    />
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import ChannelHeader from 'corteza-webapp-messaging/src/components/Channel/Header'
import Upload from 'corteza-webapp-messaging/src/components/Upload'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import mixinUnread from 'corteza-webapp-messaging/src/mixins/unread'
import mixinUpload from 'corteza-webapp-messaging/src/mixins/upload'
import ChatFooter from 'corteza-webapp-messaging/src/components/Chat/Footer'
import users from 'corteza-webapp-messaging/src/mixins/users'
import messages from 'corteza-webapp-messaging/src/mixins/messages'

const msgMinHeight = 30
const msgBuffer = 1

/**
 * Helper to calculate how many messages should be loaded
 * @returns {Number}
 */
function calcMsgCount () {
  return Math.ceil(window.innerHeight / msgMinHeight) + msgBuffer
}

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
    users,
    messages,
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
      hideNewMessages: false,
      uploadFileTypeSupported: true,

      // Assists with on-scroll loading
      previousFetchFirstMessageID: null,
      previousFetchLastMessageID: null,

      // Controlls what message should be edited
      editMessage: undefined,
    }
  },

  computed: {
    ...mapGetters({
      channelByID: 'channels/findByID',
      unreadFinder: 'unread/find',
      findWhereMember: 'channels/findWhereMember',
      uiEnableSubmitButton: 'ui/enableSubmitButton',
      findChannelByMembership: 'channels/findByMembership',
      canCreateGroupChannel: 'session/canCreateGroupChannel',
    }),

    /**
     * Determines current data source. Used for watchers
     * @returns {String}
     */
    source () {
      return this.channelID
    },

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
      return !this.uiEnableSubmitButton
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

    // Serves as a helper for unread procedures
    lastMessage () {
      return this.messages.length ? this.messages[this.messages.length - 1] : null
    },

    channel () {
      return this.channelByID(this.channelID)
    },

    isMember () {
      if (!this.channel) {
        return false
      }
      return this.channel.isMember(this.$auth.user.userID)
    },

    unread () {
      return this.unreadFinder(this.channel)
    },
  },

  watch: {
    source: {
      handler () {
        if (!this.messageID) {
          this.loadMessages()
        }
        this.getUsers([this.channel])
      },
    },

    messageID: {
      immediate: true,
      handler (messageID) {
        if (messageID) {
          this.loadContext(messageID)
        } else {
          this.hideNewMessages = false
          this.loadMessages()
        }
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
    onPaste (e) {
      const cd = e.clipboardData || window.clipboardData
      const files = cd.files
      if (!files || !files.length) {
        return
      }
      e.preventDefault()
      e.stopPropagation()

      this.$refs.upload.dropzone().addFile(files[0])
    },

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

    ...mapActions({
      markAllAsRead: 'unread/markChannelAsRead',
      fromMessage: 'unread/fromMessage',
    }),

    onPromptFilePicker (e) {
      this.$refs.upload.openFilePicker(e)
    },

    isFollowing ({ channelID, replyTo }) {
      if (!this.channel || this.hideNewMessages) {
        return false
      }

      return document.hasFocus() && this.channel.channelID === channelID && !replyTo
    },

    loadContext (messageID) {
      // Set this to false to allow message loading
      this.hideNewMessages = false
      this.editLastMessage = false
      this.previousFetchFirstMessageID = null

      this.messagesLoad({
        filter: {
          channelID: this.channelID,
          toMessageID: messageID,
          limit: 10,
        },
        overwriteState: true,
      }).then(messages => {
        messages.forEach(m => this.fromMessage(m))
        this.messagesLoad({
          filter: {
            channelID: this.channelID,
            afterMessageID: messageID,
            limit: 9,
          },
        }).then(messages => {
          messages.forEach(m => this.fromMessage(m))

          // So the message feed doesn't update with new messages
          this.hideNewMessages = true
        })
      })
    },

    loadMessages (overwriteState = false) {
      this.editLastMessage = false
      this.previousFetchFirstMessageID = null

      this.messagesLoad({
        filter: {
          channelID: this.channelID,
          fromMessageID: this.messageID,
          limit: calcMsgCount(),
        },
        overwriteState,
      }).then(messages => {
        messages.forEach(m => this.fromMessage(m))
      })
    },

    // Mark entire channel as read
    onMarkAsRead () {
      this.markAllAsRead(this.channel)
    },

    // Show the most recent messages
    onShowRecent () {
      this.$router.push({ name: 'channel', params: { channelID: this.channelID } })
    },

    onScrollTop ({ messageID }) {
      if (this.previousFetchFirstMessageID !== messageID && messageID) {
        // Make sure we do not fetch for the same lastID
        // over and over again...
        this.previousFetchFirstMessageID = messageID

        this.messagesLoad({
          filter: {
            channelID: this.channelID,
            beforeMessageID: messageID,
            limit: 50,
          },
        })
      }
    },

    fetchNewMessages () {
      let lmID
      if (this.messages.length) {
        lmID = (this.messages[this.messages.length - 1]).messageID
      }
      // @note this will be improved when the delta endpoint arrives
      if (!this.messageID) {
        this.messagesLoad({
          filter: {
            channelID: this.channelID,
            afterMessageID: lmID,
          },
        })
      }
    },

    onScrollBottom ({ messageID }) {
      /*
      if (this.previousFetchLastMessageID !== messageID && messageID) {
        // Make sure we do not fetch for the same lastID
        // over and over again...
        this.previousFetchLastMessageID = messageID

        this.messagesLoad({
          filter: {
            channelID: this.channelID,
            afterMessageID: messageID,
            limit: 50,
          },
        })
      }
      */
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

  .ch-footer {
    z-index: 2;
  }

  & > div.messages {
    flex: 1 100%;
    overflow-y: auto; //to avoid double scroll on linux
  }
}
</style>
