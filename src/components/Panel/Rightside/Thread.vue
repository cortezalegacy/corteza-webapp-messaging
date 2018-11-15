<template>
  <base-panel
    v-on="$listeners"
    @dragover="showUploadArea=true"
    @dragenter="showUploadArea=true">

    <template slot="header">Thread</template>
    <template slot="subtitle">in #{{ label(channel) }}</template>
    <template slot="main">
      <upload v-show="channel && showUploadArea"
        @close="showUploadArea=false"
        @show="showUploadArea=true"
        :channelID="channel.ID"
        :replyTo="repliesTo"
        ref="upload" />

      <messages
        class="messages"
        ref="messages"
        :readOnly="!channel.canSendMessages"
        :messages="messages"
        :currentUser="currentUser"
        :origin="channel"
        :scrollable="true"
        :hideActionOpenThread="true"
        :editLastMessage="editLastMessage"
        :lastReadMessageID="lastUnread(message)"
        @cancelEditing="editLastMessage=false"
        v-on="$listeners" />
    </template>
    <template slot="footer">
      <div class="footer">
        <message-input
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

export default {
  props: {
    repliesTo: {
      type: String,
      required: true,
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

  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
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

  data () {
    return {
      // Controls if last message in the list
      // should be have editing enabled or not
      editLastMessage: false,

      showUploadArea: false,
    }
  },

  methods: {
    // Preloads all thread data
    preload () {
      this.$ws.getReplies(this.repliesTo)
    },

    onOpenFilePicker () {
      this.$refs.upload.openFilePicker()
    },
  },

  components: {
    MessageInput,
    Upload,
    Messages,
    BasePanel,
  },
}
</script>
