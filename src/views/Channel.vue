<template>
  <section
    v-if="channel"
    :class="{ 'unread-messages': unread(channelID) }"
    @dragover="openUploadOverlay"
    @dragenter="openUploadOverlay">

    <channel-upload
      :channelID="channel.ID" ref="upload" />

    <channel-header
      :channel="channel"></channel-header>

    <messages
      class="messages"
      ref="messages"
      :messages="messages"
      :currentUser="currentUser"
      :origin="channel"
      :scrollable="true"
      :lastReadMessageID="lastUnreadMessageInChannel(channelID)"
      @scrollTop="onScrollTop"
      @scrollBottom="onScrollBottom"
      @editMessage="onEditMessage"
      @deleteMessage="onDeleteMessage"
      v-on="$listeners" />

    <channel-input
      ref="channelInput"
      @msgUpdate="onMessageUpdate"
      @submit="onInputSubmit"
      @promptFilePicker="onOpenFilePicker"
      @editLastMessage="onEditLastMessage" />

    <activity :users="activeInChannel(channelID, 'typing')">typing</activity>

  </section>
</template>
<script>
import _ from 'lodash'
import messages from '@/mixins/messages'
import { mapGetters, mapActions } from 'vuex'
import { ChannelInput, ChannelHeader, ChannelUpload } from '@/components/Channel'
import Messages from '@/components/Messages'
import Activity from '@/components/Activity'

export default {
  props: {
    channelID: {
      type: String,
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      channelByID: 'channels/findByID',

      unread: 'unread/channel',
      lastUnreadMessageInChannel: 'unread/lastMessageInChannel',

      user: 'auth/user',
      currentUser: 'auth/user',

      activeInChannel: 'users/activeInChannel',

      channelHistory: 'history/getByChannelID',

      isUserPanelOpen: 'ui/isUserPanelOpen',
    }),

    messages () {
      return this.channelHistory(this.channel.ID)
    },

    currentChannel () {
      return this.channelByID(this.channelID)
    },
  },

  data () {
    return {
      resetUnreadTimeout: null,
      channel: null,
      previousFetchFirstMessageID: null,
    }
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

  mounted () {
    window.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        // @todo fix this.
        this.closeUploadOverlay()
      }
    })
  },


  methods: {
    ...mapActions({
      clearHistory: 'history/clear',
      setCurrentChannel: 'channels/setCurrent',
      setChannelUnreadCount: 'unread/setChannel',
      ignoreChannelUnreadCount: 'unread/ignoreChannel',
      unignoreChannelUnreadCount: 'unread/unignoreChannel',
    }),

    changeChannel (channel) {
      if (!channel) return

      this.channel = channel

      this.setCurrentChannel(this.channel)

      this.previousFetchFirstMessageID = null

      this.ignoreChannelUnreadCount(this.channel.ID)

      // Ask for new messages
      this.$ws.getMessages({ channelID: this.channel.ID })
    },

    setEditMessage (currentMessage) {
      if (currentMessage) this.$refs.channelInput.setValue(currentMessage.message, { currentMessage })
    },

    openUploadOverlay () {
      this.$refs.upload.openOverlay()
    },

    closeUploadOverlay () {
      if (this.$refs.upload) {
        this.$refs.upload.closeOverlay()
      }
    },

    resetUnreadAfterTimeout (lastMessageID) {
      this.clearUnreadTimeout()

      this.resetUnreadTimeout = window.setTimeout(() => {
        this.setChannelUnreadCount({ ID: this.channel.ID, count: 0, lastMessageID })
        this.$ws.recordChannelView(this.channel.ID, lastMessageID)
      }, 2000)
    },

    clearUnreadTimeout () {
      if (this.resetUnreadTimeout !== null) {
        window.clearTimeout(this.resetUnreadTimeout)
      }
    },

    // Update channel activity once in a while while typing
    onMessageUpdate: _.throttle(function ({ msg }) {
      if (msg.length > 1) {
        this.$ws.send({ channelActivity: { ID: this.channel.ID, kind: 'typing' } })
      }
    }, 2000),

    onInputSubmit ({ value, meta }) {
      if (meta && meta.currentMessage) {
        const { currentMessage } = meta

        if (currentMessage.ID && value.length === 0) {
          this.onDeleteMessage(currentMessage)
        } else if (currentMessage.ID) {
          this.$rest.updateMessage(currentMessage.channelID, currentMessage.ID, value)
        }
      } else if (this.$commands.test(value)) {
        this.$commands.exec(this, value, { channel: this.channel })
      } else if (value) {
        // Using current channel info here.
        this.setChannelUnreadCount({ ID: this.channelID, count: 0, lastMessageID: 0 })
        this.$rest.sendMessage(this.channelID, value)
      }
    },

    onDeleteMessage ({ ID, channelID }) {
      if (confirm('Delete this message?')) {
        this.$rest.deleteMessage(channelID, ID)
      }
    },

    onEditMessage ({ message }) {
      this.setEditMessage(message)
    },

    onEditLastMessage (ev) {
      // Ask history component about last editable message
      this.setEditMessage(this.$refs.messages.getLastEditable())
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

    onScrollBottom ({ messageID }) {
      if (document.hasFocus()) this.resetUnreadAfterTimeout(messageID)
    },
  },

  components: {
    Messages,
    ChannelInput,
    ChannelUpload,
    ChannelHeader,
    Activity,
  },

  mixins: [
    messages,
  ],
}
</script>

<style lang="scss" scoped>
@import '@/assets/sass/_0.commons.scss';
//disposition of elements is done here:
.header,
.channel-input,
.messages
{
  position:absolute;
  width:100%;
  max-width:100vw;
  left:0;
}
.header
{
  top:0;
}
.channel-input
{
  bottom:0;
}
.messages
{
  top:52px;
}

@media (min-width: $wideminwidth)
{
  .header,
  .channel-input,
  .messages
  {
    right:0;
  }
  .messages
  {
    top:62px;
    bottom:65px;
  }
}

section.activity {
  color: $appgrey;
  position: absolute;
  left: 65px;
  bottom: 5px;
}
</style>
