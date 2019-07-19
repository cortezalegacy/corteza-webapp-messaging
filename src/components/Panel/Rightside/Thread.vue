<template>
  <base-panel
    v-on="$listeners"
    @dragover="handleShow($event, () => showUploadArea = true)"
    @dragenter="handleShow($event, () => showUploadArea = true)">

    <template slot="header">{{ $t('panel.thread') }}</template>
    <template slot="subtitle" v-if="channel.type === 'group'">{{ $t('panel.inGroupChat', { label: label(channel) }) }}</template>
    <template slot="subtitle" v-else>{{ $t('panel.inChannelChat', { label: label(channel) }) }}</template>
    <template v-if="message" slot="main">
      <upload v-show="channel && showUploadArea"
        @close="showUploadArea=false; uploadFileTypeSupported=true"
        @show="showUploadArea=true"
        :channelID="channel.channelID"
        :replyTo="repliesTo"
        :typeSupported.sync="uploadFileTypeSupported"
        ref="upload" />

      <messages
        class="messages"
        ref="messages"
        :messages="messages"
        :currentUser="$auth.user"
        :origin="message"
        :scrollable="true"
        :consecutive="true"
        :hideActionOpenThread="true"
        :lastReadMessageID="unread.lastMessageID"
        :editLastMessage="editLastMessage"
        :readOnly="!channel.canSendMessages"
        hide-replies
        @markAsUnread="onMarkAsUnread"
        @scrollTop="onScrollTop"
        @scrollBottom="onScrollBottom"
        @cancelEditing="editLastMessage=false"
        v-on="$listeners" />
    </template>
    <template v-if="message" slot="footer">
      <div class="footer">
        <message-input
          v-if="channel.canSendMessages"
          :replyTo="message"
          :show-mark-as-unread-button="unread.count > 0"
          :draft.sync="draft"
          @markAsRead="onMarkAsRead"
          @promptFilePicker="onOpenFilePicker"
          @editLastMessage="editLastMessage=true" />
      </div>
    </template>
  </base-panel>
</template>
<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import BasePanel from './.'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import MessageInput from 'corteza-webapp-messaging/src/components/MessageInput'
import Upload from 'corteza-webapp-messaging/src/components/MessageInput/Upload'
import mixinUnread from 'corteza-webapp-messaging/src/mixins/unread'
import mixinUpload from 'corteza-webapp-messaging/src/mixins/upload'
import { messagesLoad } from 'corteza-webapp-messaging/src/lib/messenger'
import Delta from 'quill-delta'

export default {
  components: {
    MessageInput,
    Upload,
    Messages,
    BasePanel,
  },

  mixins: [
    mixinUnread,
    mixinUpload,
  ],

  props: {
    repliesTo: {
      type: String,
      required: true,
    },
  },

  data () {
    return {
      // Controls if last message in the list
      // should be have editing enabled or not
      editLastMessage: false,

      showUploadArea: false,
      uploadFileTypeSupported: true,
    }
  },

  computed: {
    ...mapGetters({
      getMessageByID: 'history/getByID',
      findUserByID: 'users/findByID',
      getThread: 'history/getThread',
      getChannelByID: 'channels/findByID',
      unreadFinder: 'unread/find',
    }),

    draft: {
      get () {
        const d = this.$drafts.get({ messageID: this.repliesTo })
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

    message () {
      // Thread start
      return this.getMessageByID(this.repliesTo)
    },

    channelID () {
      return (this.message || {}).channelID
    },

    channel () {
      return this.getChannelByID(this.channelID) || {}
    },

    messages () {
      return this.getThread(this.repliesTo)
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

    repliesTo (newRepliesTo, oldRepliesTo) {
      if (newRepliesTo && newRepliesTo !== oldRepliesTo) {
        this.loadMessages()
      }
    },
  },

  created () {
    this.loadMessages()
  },

  methods: {
    ...mapMutations({
      // @todo remove direct access to mutations!
      updateHistorySet: 'history/updateSet',
    }),

    ...mapActions({
      markAllAsRead: 'unread/markThreadAsRead',
    }),

    isFollowing ({ replyTo }) {
      return document.hasFocus() && this.repliesTo === replyTo
    },

    // Preloads thread
    loadMessages () {
      messagesLoad(this.$MessagingAPI, this.findUserByID, { channelID: this.channelID, threadID: this.repliesTo }).then((mm) => {
        this.updateHistorySet(mm)
      })
    },

    onOpenFilePicker () {
      this.$refs.upload.openFilePicker()
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

        messagesLoad(this.$MessagingAPI, this.findUserByID, { channelID: this.channelID, threadID: this.repliesTo }).then((mm) => {
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
