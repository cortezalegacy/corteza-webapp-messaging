<template>
  <section class="channel">
    <div style="height: 200px; border: 2px solid silver; padding: 30px; margin: 50px">
    here be user info
  </div>
    <channel-history></channel-history>
    <channel-input
      :userId="userId"
      @directMessageSent="onDirectMessageSent"
    ></channel-input>
  </section>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import { ChannelHistory, ChannelInput } from '../components/Channel'

export default {
  props: ['userId'],

  data () {
    return {
      showChannelEditor: false
    }
  },

  computed: {
    ...mapGetters({
      ch: 'channels/current',
      editor: 'channels/editor',
      isAuthenticated: 'auth/isAuthenticated'
    })
  },

  watch: {
    'directId' (newchannelID) {
      this.setCurrentById(newchannelID)
    }
  },

  mounted () {
    this.setCurrentById(this.directId)
  },

  methods: {
    ...mapActions({
      setCurrentById: 'channels/setCurrentById'
    }),

    onDirectMessageSent (msg) {
      // Expecting to get notified about new channel, so let's go there when it comes
      this.$ws.once('channels', () => {
        // We know where we want to go from the msg reply
        this.$router.push({name: 'channel', params: {channelID: msg.channelID}})
      })

      // @todo remove this when REST actions trigger updates via WS
      this.$ws.getChannels()
    }
  },

  components: {
    ChannelHistory,
    ChannelInput
  }
}
</script>
