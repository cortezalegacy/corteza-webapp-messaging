<template>
  <section
    class="channel"
    v-if="ch"
    id="channelContainer"
    @dragover="openUploadOverlay"
    @dragenter="openUploadOverlay">
    <channel-upload
      :channelID="channelID" v-if="ch" ref="upload"></channel-upload>
    <channel-header
      :channel="ch"
      v-if="ch"></channel-header>
    <channel-history></channel-history>
    <channel-input
      :channelID="channelID"
      @promptFilePicker="openFilePicker"></channel-input>
  </section>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import { ChannelHistory, ChannelInput, ChannelHeader, ChannelUpload } from '../components/Channel'

export default {
  props: ['channelID'],

  computed: {
    ...mapGetters({
      ch: 'channels/current',
      editor: 'channels/editor',
      isAuthenticated: 'auth/isAuthenticated',
      files: 'channels/files',
      lastMessage: 'channels/lastMessage',
    }),
  },

  watch: {
    'channelID' (newChannelID, oldChannelId) {
      if (newChannelID !== oldChannelId && newChannelID) {
        this.setCurrentById(newChannelID)
      }
    },
  },

  beforeMount () {
    this.setCurrentById(this.channelID)

    window.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        // @todo fix this.
        this.closeUploadOverlay()
      }
    })
  },

  methods: {
    ...mapActions({
      setCurrentById: 'channels/setCurrentById',
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
    },
  },

  components: {
    ChannelHistory,
    ChannelInput,
    ChannelUpload,
    ChannelHeader,
  },
}
</script>

<style lang="scss" scoped>
  @import '@/assets/sass/_0.commons.scss';
  //disposition of elements is done here:
  .header,
  .channel-input,
  .history
  {
    position:fixed;
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
    overflow:hidden auto;
  }
  .history
  {
    top:52px;
    bottom:50px;
  }
  @media (min-width: $wideminwidth)
  {
    .header,
    .channel,
    .channel-input,
    .history
    {
      margin-left:320px;
      max-width:calc(100vw - 320px);
    }
    .history
    {
      top:62px;
      bottom:50px;
    }
  }
</style>
