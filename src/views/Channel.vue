<template>
  <section
    class="channel"
    v-if="ch"
    id="channelContainer"
    :class="[ { 'with-right-panel':isUserPanelOpen, 'unread-messages': unread(channelID) } ]"
    @dragover="openUploadOverlay"
    @dragenter="openUploadOverlay">
    <channel-upload
      :channelID="channelID" v-if="ch" ref="upload"></channel-upload>
    <channel-header
      :channel="ch"
      v-if="ch"></channel-header>

    <history
      ref="history"
      @editMessage="setEditMessage" />

    <channel-input
      ref="channelInput"
      @submit="onInputSubmit"
      @promptFilePicker="openFilePicker"
      @editLast="editLastMessage" />

  </section>
</template>
<script>
import commander from '@/plugins/commander'
import { mapGetters, mapActions } from 'vuex'
import { ChannelInput, ChannelHeader, ChannelUpload } from '@/components/Channel'
import History from '@/components/History'

export default {
  props: ['channelID'],

  computed: {
    ...mapGetters({
      ch: 'channels/current',
      unread: 'unread/channel',
      isUserPanelOpen: 'ui/isUserPanelOpen',
      user: 'auth/user',
    }),
  },

  watch: {
    'channelID' (newChannelID, oldChannelId) {
      if (newChannelID !== oldChannelId && newChannelID) {
        this.changeChannel(newChannelID)
      }
    },
  },

  mounted () {
    this.changeChannel(this.channelID)

    window.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        // @todo fix this.
        this.closeUploadOverlay()
      }
    })

    // Set initial channel on load
    this.changeChannel(this.channelID)
  },


  methods: {
    ...mapActions({
      setCurrentById: 'channels/setCurrentById',
      clearHistory: 'history/clear',
    }),

    changeChannel (channelID) {
      this.setCurrentById(this.channelID)
      this.clearHistory()
      this.$ws.getMessages(this.channelID)

      if (this.ch) {
        document.title = `${this.ch.name} | Crust`
      } else {
        document.title = `Crust`
      }
    },

    openFilePicker () {
      this.$refs.upload.openFilePicker()
    },

    setEditMessage (msg = {}) {
      let { message, ID } = msg || {}
      this.$refs.channelInput.setValue(message, { ID })
    },

    editLastMessage () {
      // Ask history component about last editable message
      // @todo uncomment when message editing is fixed
      // this.setEditMessage(this.$refs.history.getLastEditable())
    },

    openUploadOverlay () {
      this.$refs.upload.openOverlay()
    },

    closeUploadOverlay () {
      this.$refs.upload.closeOverlay()
    },

    onInputSubmit (e) {
      // @todo this is standard submit handling... move it to a common place (plugin, mixin...)
      if (!this.channelID) {
        return
      }

      const { message, meta } = e

      if (message.length > 1 && message[0] === '/') {
        if (!this.execLocal(message)) {
          const i = message.indexOf(' ')
          if (i < 1) {
            return
          }

          const command = message.substr(1, i - 1)
          const input = message.substr(i + 1)

          console.debug('Executing a command', { command, input })
          this.$ws.exec(this.channelID, command, {}, input)
        }
      } else if (meta.ID && message.length === 0) {
        console.debug('Delete message [DISABLED UNTIL FIXED!]', { ID: meta.ID })
        // this.$ws.deleteMessage(meta.ID)
      } else if (meta.ID) {
        console.debug('Sending message update [DISABLED UNTIL FIXED!]', { message, ID: meta.ID })
        // this.$ws.updateMessage(meta.ID, message)
      } else {
        console.debug('Sending new message', { message, channelID: this.channelID })
        this.$ws.sendMessage(this.channelID, message)
      }
    },
  },

  components: {
    History,
    ChannelInput,
    ChannelUpload,
    ChannelHeader,
  },

  mixins: [
    commander,
  ],
}
</script>

<style lang="scss" scoped>
  @import '@/assets/sass/_0.commons.scss';
  //disposition of elements is done here:
  .header,
  .channel-input,
  .history
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

    &.unread-messages {
      border-bottom: 5px solid red;
    }
  }
  .history
  {
    top:52px;
    bottom:52px;
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
    .history
    {
      right:0;
    }
    .history
    {
      top:62px;
      bottom:65px;
    }
  }
</style>
