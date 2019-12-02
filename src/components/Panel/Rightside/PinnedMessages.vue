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
        :messages="messages"
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
import BasePanel from './.'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import users from 'corteza-webapp-messaging/src/mixins/users'
import messages from 'corteza-webapp-messaging/src/mixins/messages'

export default {
  components: {
    BasePanel,
    Messages,
  },

  mixins: [
    users,
    messages,
  ],

  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  mounted () {
    this.messagesLoad(this.$MessagingAPI, { pinnedOnly: true, channelID: this.channelID })
  },
}
</script>
