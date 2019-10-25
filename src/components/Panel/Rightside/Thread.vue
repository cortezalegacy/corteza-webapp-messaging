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
        :edit-last-message="editLastMessage"
        :read-only="!channel.canSendMessages"
        :suggestion-priorities="getSp"
        hide-replies
        @markAsUnread="onMarkAsUnread"
        @scrollTop="onScrollTop"
        @scrollBottom="onScrollBottom"
        @cancelEditing="editLastMessage=false"
        v-on="$listeners"
      />
    </template>
    <template
      v-if="message"
      slot="footer"
    >
      <div class="footer">
        <message-input
          v-if="channel.canSendMessages"
          :reply-to="message"
          :show-mark-as-unread-button="unread.count > 0"
          :draft.sync="draft"
          :suggestion-priorities="getSp"
          @markAsRead="onMarkAsRead"
          @promptFilePicker="onPromptFilePicker"
          @editLastMessage="editLastMessage=true"
        />
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
      markAllAsRead: 'unread/markThreadAsRead',
    }),

    onPromptFilePicker (e) {
      this.$refs.upload.openFilePicker(e)
    },

    isFollowing ({ replyTo }) {
      return document.hasFocus() && this.repliesTo === replyTo
    },

    // Preloads thread
    loadMessages () {
      messagesLoad(this.$MessagingAPI, this.findUserByID, { channelID: this.channelID, threadID: this.repliesTo }).then((mm) => {
        this.updateHistorySet(mm)
      })
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

    fetchNewMessages () {
      let lmID
      if (this.messages.length) {
        lmID = (this.messages[this.messages.length - 1]).messageID
      }
      // @note this will be improved when the delta endpoint arrives
      messagesLoad(this.$MessagingAPI, this.findUserByID, { threadID: this.repliesTo, afterMessageID: lmID }).then((mm) => {
        this.updateHistorySet(mm)
      })
    },
  },
}
</script>
