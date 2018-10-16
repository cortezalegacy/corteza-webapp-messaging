<template>
  <section
    class="channel"
    v-if="ch"
    id="channelContainer"
    :class="[ { 'with-right-panel':isUserPanelOpen } ]"
    @dragover="openUploadOverlay"
    @dragenter="openUploadOverlay">
    <channel-upload
      :channelID="channelID" v-if="ch" ref="upload"></channel-upload>
    <channel-header
      :channel="ch"
      v-if="ch"></channel-header>
    <channel-history
      ref="history"></channel-history>
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
      isUserPanelOpen: 'ui/isUserPanelOpen',
    }),
  },

  watch: {
    'channelID' (newChannelID, oldChannelId) {
      if (newChannelID !== oldChannelId && newChannelID) {
        this.setCurrentById(newChannelID)
      }
    },
  },

  mounted () {
    this.setCurrentById(this.channelID)

    window.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        // @todo fix this.
        this.closeUploadOverlay()
      }
    })

    // Set initial channel on load
    this.setCurrentById(this.channelID)
  },


  methods: {
    ...mapActions({
      setCurrentById: 'channels/setCurrentById',
    }),

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
