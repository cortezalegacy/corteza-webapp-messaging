<template>
  <section
    class="channel"
    v-if="ch"
    id="channelContainer"
    :class="[ { 'with-right-panel':isUserPanelOpen, 'unread-messages': unread(channelID) } ]"
    @dragover="openUploadOverlay"
    @dragenter="openUploadOverlay">

    <channel-upload v-if="ch"
                    :channelID="ch.ID" ref="upload"></channel-upload>

    <channel-header
      :channel="ch"
      v-if="ch"></channel-header>

    <history
      ref="history"
      v-on="$listeners"
      @editMessage="onEditMessage"
      @deleteMessage="onDeleteMessage" />

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
import commander from '@/plugins/commander'
import { mapGetters, mapActions } from 'vuex'
import { ChannelInput, ChannelHeader, ChannelUpload } from '@/components/Channel'
import History from '@/components/History'
import Activity from '@/components/Activity'

export default {
  props: ['channelID'],

  computed: {
    ...mapGetters({
      ch: 'channels/current',
      unread: 'unread/channel',
      isUserPanelOpen: 'ui/isUserPanelOpen',
      user: 'auth/user',
      activeInChannel: 'users/activeInChannel',
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

    setEditMessage (message) {
      this.$refs.channelInput.setValue(message.message, message)
    },

    openUploadOverlay () {
      this.$refs.upload.openOverlay()
    },

    closeUploadOverlay () {
      if (this.$refs.upload) {
        this.$refs.upload.closeOverlay()
      }
    },

    // Update channel activity once in a while while typing
    onMessageUpdate: _.throttle(function ({ msg }) {
      if (msg.length > 1) {
        this.$ws.send({ channelActivity: { ID: this.ch.ID, kind: 'typing' } })
      }
    }, 2000),

    onInputSubmit ({ value, meta }) {
      // @todo this is standard submit handling... move it to a common place (plugin, mixin...)
      if (!this.channelID) {
        return
      }

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
      this.setEditMessage(this.$refs.history.getLastEditable())
    },

    onOpenFilePicker () {
      this.$refs.upload.openFilePicker()
    },
  },

  components: {
    History,
    ChannelInput,
    ChannelUpload,
    ChannelHeader,
    Activity,
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
