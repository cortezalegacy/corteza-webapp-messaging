<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.ID);">
    <template slot="header">{{ $t('panel.pinnedMessagesHeader') }}</template>
    <template slot="subtitle" v-if="channel.type === 'group'">{{ $t('panel.pinnedGroupMessagesSubtitle', { label: label(channel) }) }}</template>
    <template slot="subtitle" v-else>{{ $t('panel.pinnedMessagesSubtitle', { label: label(channel) }) }}</template>

    <template slot="main">
      <messages
        :messages="pinned"
        :currentUser="$auth.user"
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
import { messagesLoad } from '@/lib/messenger'

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
      allPinned: 'history/getPinned',
    }),

    pinned () {
      return this.allPinned.filter(m => m.channelID === this.channel.ID)
    },
  },

  mounted () {
    messagesLoad(this.$messaging, this.$store.getters['users/findByID'], { pinnedOnly: true, channelID: this.channelID }).then((msgs) => {
      this.$store.commit('history/updateSet', msgs)
    })
  },
}
</script>
