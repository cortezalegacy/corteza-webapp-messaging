<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.userID);"
  >
    <template slot="header">
      {{ $t('panel.pinnedMessagesHeader') }}
    </template>
    <template
      v-if="channel.type === 'group'"
      slot="subtitle"
    >
      {{ $t('panel.pinnedGroupMessagesSubtitle', { label: getLabel(channel) }) }}
    </template>
    <template
      v-else
      slot="subtitle"
    >
      {{ $t('panel.pinnedMessagesSubtitle', { label: channel.name }) }}
    </template>

    <template slot="main">
      <messages
        :messages="pinned"
        :current-user="$auth.user"
        :origin="{ thread: 'pinned' }"
        :scrollable="false"
        :highlight-pinned="false"
        v-on="$listeners"
      />
    </template>
  </base-panel>
</template>
<script>
import { mapGetters } from 'vuex'
import BasePanel from './.'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import { messagesLoad } from 'corteza-webapp-messaging/src/lib/messenger'

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
      return this.allPinned.filter(m => m.channelID === this.channel.channelID)
    },
  },

  mounted () {
    messagesLoad(this.$MessagingAPI, this.$store.getters['users/findByID'], { pinnedOnly: true, channelID: this.channelID }).then((msgs) => {
      this.$store.commit('history/updateSet', msgs)
    })
  },
}
</script>
