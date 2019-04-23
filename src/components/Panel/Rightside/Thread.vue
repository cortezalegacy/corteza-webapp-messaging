<template>
  <base-panel
    v-on="$listeners"
    @dragover="handleShow($event, () => showUploadArea = true)"
    @dragenter="handleShow($event, () => showUploadArea = true)">

    <template slot="header">{{ $t('panel.thread') }}</template>
    <template slot="subtitle" v-if="channel.type === 'group'">{{ $t('panel.inGroupChat', { label: label(channel) }) }}</template>
    <template slot="subtitle" v-else>{{ $t('panel.inChannelChat', { label: label(channel) }) }}</template>
    <template slot="main">
      <upload v-show="channel && showUploadArea"
        @close="showUploadArea=false; uploadFileTypeSupported=true"
        @show="showUploadArea=true"
        :channelID="channel.ID"
        :replyTo="repliesTo"
        :typeSupported.sync="uploadFileTypeSupported"
        ref="upload" />

      <messages
        class="messages"
        ref="messages"
        :readOnly="!channel.canSendMessages"
        :messages="messages"
        :currentUser="$auth.user"
        :origin="message"
        :scrollable="true"
        :hideActionOpenThread="true"
        :editLastMessage="editLastMessage"
        :lastReadMessageID="lastUnread(message)"
        @scrollBottom="onScrollBottom"
        @cancelEditing="editLastMessage=false"
        v-on="$listeners" />
    </template>
    <template slot="footer">
      <div class="footer">
        <message-input
          @markAsRead="onMarkAsRead"
          :replyTo="message"
          v-if="channel.canSendMessages"
          @promptFilePicker="onOpenFilePicker"
          @editLastMessage="editLastMessage=true" />
      </div>
    </template>
  </base-panel>
</template>
<script>
import { mapGetters } from 'vuex'
import BasePanel from './.'
import Messages from '@/components/Messages'
import MessageInput from '@/components/MessageInput'
import Upload from '@/components/MessageInput/Upload'
import mixinUnread from '@/mixins/unread'
import mixinUpload from '@/mixins/upload'

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
      getThread: 'history/getThread',
      getChannelByID: 'channels/findByID',
      lastUnread: 'unread/last',
    }),

    message () {
      return this.getMessageByID(this.repliesTo)
    },

    channelID () {
      return this.message.channelID
    },

    channel () {
      return this.getChannelByID(this.channelID) || {}
    },

    messages () {
      return this.getThread(this.repliesTo)
    },
  },

  watch: {
    repliesTo (newRepliesTo, oldRepliesTo) {
      if (newRepliesTo && newRepliesTo !== oldRepliesTo) {
        this.preload()
      }
    },
  },

  created () {
    this.preload()
  },

  methods: {
    // Preloads all thread data
    preload () {
      this.$ws.getReplies(this.repliesTo)
    },

    onOpenFilePicker () {
      this.$refs.upload.openFilePicker()
    },

    // Prepares payload for unread resetting
    unreadResetPayload () {
      return { channelID: this.channel.ID, threadID: this.message.ID }
    },
  },
}
</script>
