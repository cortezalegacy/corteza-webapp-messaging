<template>
  <base-panel
    v-on="$listeners"
    @dragover="handleShow($event, () => showUploadArea = true)"
    @dragenter="handleShow($event, () => showUploadArea = true)"
  >
    <template slot="header">
      {{ $t('panel.thread') }}
    </template>
    <template
      v-if="channel.type === 'group'"
      slot="subtitle"
    >
      {{ $t('panel.inGroupChat', { label: getLabel(channel) }) }}
    </template>
    <template
      v-else
      slot="subtitle"
    >
      {{ $t('panel.inChannelChat', { label: channel.name }) }}
    </template>
    <template
      v-if="message"
      slot="main"
    >
      <upload
        v-if="$s('Message.Attachments.Enabled', true)"
        v-show="channel && showUploadArea"
        ref="upload"
        :channel-i-d="channel.channelID"
        :reply-to="repliesTo"
        :type-supported.sync="uploadFileTypeSupported"
        @close="showUploadArea=false; uploadFileTypeSupported=true"
        @show="showUploadArea=true"
      />

      <messages
        ref="messages"
        class="messages"
        :messages="messages"
        :current-user="$auth.user"
        :origin="message"
        :scrollable="true"
        :consecutive="true"
        :hide-action-open-thread="true"
        :last-read-message-i-d="unread.lastMessageID"
        :submit-on-enter="submitOnEnter"
        :edit="edit"
        :channel="channel"
        :read-only="!channel.canSendMessages"
        :suggestion-priorities="getSp"
        hide-replies
        @markAsUnread="onMarkAsUnread"
        @scrollTop="onScrollTop"
        @scrollBottom="onScrollBottom"
        @cancelEditing="onCancelEditing"
        @editMessage="onEditMessage"
        @mentionSelect="onMentionSelect"
        @messageReaction="onMessageReaction"
        @bookmarkMessage="onBookmarkMessage"
        @pinMessage="onPinMessage"
        @deleteMessage="onDeleteMessage"
        v-on="$listeners"
      />
    </template>

    <chat-footer
      v-if="message"
      slot="footer"
      :channel="channel"
      :has-unread="unread.count > 0"
      :submit-on-enter="submitOnEnter"
      :reply-to="message"
      :suggestion-priorities="getSp"
      :users="users"
      @markAsRead="onMarkAsRead"
      @promptFilePicker="onPromptFilePicker"
      @editLastMessage="onEditLastMessage"
    />
  </base-panel>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import BasePanel from './.'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import Upload from 'corteza-webapp-messaging/src/components/Upload'
import mixinUnread from 'corteza-webapp-messaging/src/mixins/unread'
import mixinUpload from 'corteza-webapp-messaging/src/mixins/upload'
import ChatFooter from 'corteza-webapp-messaging/src/components/Chat/Footer'
import users from 'corteza-webapp-messaging/src/mixins/users'
import messages from 'corteza-webapp-messaging/src/mixins/messages'

export default {
  components: {
    Upload,
    Messages,
    BasePanel,
    ChatFooter,
  },

  mixins: [
    mixinUnread,
    mixinUpload,
    users,
    messages,
  ],

  props: {
    message: {
      type: Object,
      required: true,
    },
  },

  data () {
    return {
      // Controlls what message should be edited
      edit: undefined,

      showUploadArea: false,
      uploadFileTypeSupported: true,
    }
  },

  computed: {
    ...mapGetters({
      getChannelByID: 'channels/findByID',
      unreadFinder: 'unread/find',
      findWhereMember: 'channels/findWhereMember',
      canCreateGroupChannel: 'session/canCreateGroupChannel',
    }),

    repliesTo () {
      return this.message.messageID
    },

    channel () {
      return this.getChannelByID(this.message.channelID) || {}
    },

    channelID () {
      return this.message.channelID
    },

    /**
     * Helper to determine if enter should submit. If not, a send button will be visible
     * @returns {Boolean}
     */
    submitOnEnter () {
      return !this.$store.getters['ui/enableSubmitButton']
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

    unread () {
      return this.unreadFinder(this.message)
    },
  },

  watch: {
    message (newVal) {
      // If root msg was deleted, then the thread should close
      if (!newVal) {
        this.$emit('close')
      }
    },

    repliesTo: {
      handler: function (newRepliesTo, oldRepliesTo) {
        this.messages = []
        this.updateMessages(this.message)
        this.loadMessages()
      },
      immediate: true,
    },
  },

  created () {
    this.$root.$on('wake', this.fetchNewMessages)
  },
  beforeDestroy () {
    this.$root.$off('wake', this.fetchNewMessages)
  },

  methods: {
    ...mapActions({
      markAllAsRead: 'unread/markThreadAsRead',
    }),

    /**
     * Helper to cancel message editing
     */
    onCancelEditing () {
      this.edit = undefined
    },

    /**
     * Helper to set a given message as beeing edited
     * @param {Object} message Message to edit
     */
    onEditMessage ({ message }) {
      this.edit = message.messageID
    },

    /**
     * Helper to set the last message as beeing edited
     */
    onEditLastMessage () {
      this.onEditMessage({ message: this.lastMessage })
    },

    onPromptFilePicker (e) {
      this.$refs.upload.openFilePicker(e)
    },

    isFollowing ({ replyTo }) {
      return document.hasFocus() && this.repliesTo === replyTo
    },

    // Preloads thread
    loadMessages () {
      const filter = {
        channelID: this.channelID,
        threadID: this.repliesTo,
      }
      this.messagesThreadLoad({ filter })
    },

    // Mark entire thread as read
    onMarkAsRead () {
      this.markAllAsRead(this.message)
    },

    onScrollTop ({ messageID }) {
      if (this.previousFetchFirstMessageID !== messageID) {
        // Make sure we do not fetch for the same lastID
        // over and over again...
        this.previousFetchFirstMessageID = messageID

        const filter = {
          channelID: this.channelID,
          threadID: this.repliesTo,
        }

        this.messagesThreadLoad({ filter })
      }
    },

    onScrollBottom () {
      // @todo bottom loading
    },

    fetchNewMessages () {
      let lmID
      if (this.messages.length) {
        lmID = (this.messages[this.messages.length - 1]).messageID
      }

      // @note this will be improved when the delta endpoint arrives
      const filter = {
        threadID: this.repliesTo,
        afterMessageID: lmID,
      }

      this.messagesThreadLoad({ filter })
    },
  },
}
</script>
