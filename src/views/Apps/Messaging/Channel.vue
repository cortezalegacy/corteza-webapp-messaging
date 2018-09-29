<template>
  <section
    class="channel" v-if="ch"
    id="channelContainer"
    @dragover="openUploadOverlay"
    @dragenter="openUploadOverlay">

    <channel-upload :channelID="channelID" v-if="ch" ref="upload"></channel-upload>
    <channel-header :channel="ch" v-if="ch"></channel-header>
    <channel-history></channel-history>
    <channel-input :channelID="channelID" @promptFilePicker="openFilePicker"></channel-input>
  </section>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import { ChannelHistory, ChannelInput, ChannelHeader, ChannelUpload } from './components/Channel'

export default {
  props: ['channelID'],

  computed: {
    ...mapGetters({
      ch: 'messagingChannels/current',
      editor: 'messagingChannels/editor',
      isAuthenticated: 'auth/isAuthenticated',
      files: 'messagingChannels/files',
      lastMessage: 'messagingChannels/lastMessage'
    })
  },

  watch: {
    'channelID' (newChannelID, oldChannelId) {
      if (newChannelID !== oldChannelId && newChannelID) {
        this.setCurrentById(newChannelID)
      }
    }
  },

  mounted () {
    this.setCurrentById(this.channelID)

    window.addEventListener('keyup', (event) => {
      const ESC = 27
      // If down arrow was pressed...
      if (event.keyCode === ESC) {
        console.debug('Closing overlay on ESC')
        this.closeUploadOverlay()
      }
    })
  },

  methods: {
    ...mapActions({
      setCurrentById: 'messagingChannels/setCurrentById'
    }),

    updateHistory () {
      const lastMessageId = this.lastMessage(this.channelID)

      if (lastMessageId > 0) {
        this.$ws.newMessages(this.channelID, lastMessageId)
      }
    },

    openFilePicker () {
      this.$refs.upload.openFilePicker()
    },

    openUploadOverlay () {
      this.$refs.upload.openOverlay()
    },

    closeUploadOverlay () {
      this.$refs.upload.closeOverlay()
    }
  },

  components: {
    ChannelHistory,
    ChannelInput,
    ChannelUpload,
    ChannelHeader
  }
}
</script>
