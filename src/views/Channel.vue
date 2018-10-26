<template>
  <section
    class="channel"
    v-if="channel"
    id="channelContainer"
    :class="[ { 'with-right-panel':isUserPanelOpen, 'unread-messages': unread(channelID) } ]"
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
import commander from '@/plugins/commander'
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
      incChannelUnreadCount: 'unread/incChannel',
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

    setEditMessage (message) {
      if (message) this.$refs.channelInput.setValue(message.message, message)
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
      // @todo this is standard submit handling... move it to a common place (plugin, mixin...)
      if (value.length > 1 && value[0] === '/') {
        if (!this.execLocal(value)) {
          const i = value.indexOf(' ')
          if (i < 1) {
            return
          }

          const command = value.substr(1, i - 1)
          const input = value.substr(i + 1)

          console.debug('Executing a command', { command, input })
          this.$ws.exec(this.channelID, command, {}, input)
        }
      } else if (meta && meta.ID && value.length === 0) {
        this.onDeleteMessage({ message: { ID: meta.ID } })
      } else if (meta && meta.ID) {
        this.$ws.updateMessage(meta.ID, value)
      } else if (value) {
        this.setChannelUnreadCount({ ID: this.channel.ID, count: 0, lastMessageID: 0 })
        this.$ws.sendMessage(this.channelID, value)
      }
    },

    onDeleteMessage ({ message }) {
      if (confirm('Delete this message?')) {
        this.$ws.deleteMessage(message.ID)
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
      this.resetUnreadAfterTimeout(messageID)
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
    commander,
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
  .channel
  {
    position:relative;
    margin:0;
    max-width:100vw;
    height:100vh;
    // this does not work in some browsers
    // overflow:hidden auto;
  }
  .messages
  {
    top:52px;
  }

  @media (min-width: $wideminwidth)
  {
    .channel
    {
      margin-left:320px;
      max-width:calc(100vw - 320px);
    }
    .with-right-panel
    {
      margin-right:320px;
    }
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

  @media (min-width: $confortableminwidth)
  {
    .channel.with-thread
    {
      margin-left:320px;
      margin-right:400px;
      max-width:calc(100vw - 720px);
    }
  }
</style>
