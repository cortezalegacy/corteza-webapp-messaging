<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.ID);">
    <template slot="header">Pinned messages</template>
    <template slot="subtitle" v-if="channel.type === 'group'">Public list of messages in group chat with {{ label(channel) }}</template>
    <template slot="subtitle" v-else>Public list of messages in #{{ label(channel) }}</template>

    <template slot="main">
      <messages
        :messages="pinned"
        :currentUser="currentUser"
        origin="pinned"
        :scrollable="false"
        :highlightPinned="false"
        v-on="$listeners" />
    </template>
  </base-panel>
</template>
<script>
import { mapGetters } from 'vuex'
import BasePanel from './.'
import Messages from '@/components/Messages'

export default {
  components: {
    BasePanel,
    Messages,
  },

  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
      allPinned: 'history/getPinned',
    }),

    pinned () {
      return this.allPinned.filter(m => m.channelID === this.channel.ID)
    },
  },

  mounted () {
    this.$ws.getMessages({ pinned: true, channelID: this.channelID })
  },
}
</script>
