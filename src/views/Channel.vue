<template>
  <div class="channel"
    @dragover="handleShow($event, () => showUploadArea = true)"
    @dragenter="handleShow($event, () => showUploadArea = true)"
    v-if="channel">
    <upload
      v-show="showUploadArea"
      @close="showUploadArea=false; uploadFileTypeSupported=true"
      @show="showUploadArea=true"
      :channelID="channel.ID"
      :typeSupported.sync="uploadFileTypeSupported"
      ref="upload" />

    <channel-header
      v-on="$listeners"
      :channel="channel"></channel-header>

    <div class="messages">
      <messages
        ref="messages"
        :messages="messages"
        :currentUser="currentUser"
        :origin="channel"
        :scrollable="true"
        :consecutive="true"
        :lastReadMessageID="lastReadMessageID(channelID)"
        :editLastMessage="editLastMessage"
        :readOnly="!channel.canSendMessages"
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
        @markAsRead="onMarkAsRead"
        @promptFilePicker="onOpenFilePicker"
        @editLastMessage="editLastMessage=true" />
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import ChannelHeader from '@/components/Channel/Header'
import MessageInput from '@/components/MessageInput'
import Upload from '@/components/MessageInput/Upload'
import Messages from '@/components/Messages'
import mixinUnread from '@/mixins/unread'
import mixinUpload from '@/mixins/upload'

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

      // resetUnreadTimeout: null,
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

      unread: 'unread/channel',
      lastReadMessageID: 'unread/last',

      user: 'auth/user',
      currentUser: 'auth/user',

      channelHistory: 'history/getByChannelID',
    }),

    messages () {
      return this.channelHistory(this.channel.ID)
    },

    currentChannel () {
      return this.channelByID(this.channelID)
    },

    isMember () {
      return this.channel.isMember(this.user.ID)
    },
  },

  watch: {
    currentChannel: {
      handler: function () {
        this.changeChannel(this.currentChannel)
      },
      deep: true,
    },
  },

  created () {
    let c = this.currentChannel
    if (!c) return

    this.changeChannel(c)
  },

  methods: {
    ...mapActions({
      clearHistory: 'history/clear',
      setCurrentChannel: 'channels/setCurrent',
    }),

    changeChannel (channel) {
      if (!channel) return

      this.editLastMessage = false
      this.channel = channel

      this.setCurrentChannel(this.channel)

      this.previousFetchFirstMessageID = null

      // @todo unread this.ignoreChannelUnreadCount(this.channel.ID)

      // @todo <fromID> does not work as expected
      // need to rewire message fetching via rest and react
      // after response is actually received
      this.$ws.getMessages({ channelID: this.channel.ID, fromID: this.messageID })
    },

    onOpenFilePicker () {
      this.$refs.upload.openFilePicker()
    },

    onScrollTop ({ messageID }) {
      if (this.previousFetchFirstMessageID !== messageID) {
        // Make sure we do not fetch for the same lastID
        // over and over again...
        this.previousFetchFirstMessageID = messageID

        this.$ws.getMessages({
          channelID: this.channel.ID,
          lastID: messageID,
        })
      }
    },

    // Prepares payload for unread resetting
    unreadResetPayload () {
      return { channelID: this.channel.ID }
    },
  },
}
</script>
<style lang="scss" scoped>
@import '@/assets/sass/_0.commons.scss';

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
