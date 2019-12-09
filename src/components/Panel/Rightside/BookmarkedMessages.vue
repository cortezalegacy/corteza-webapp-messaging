<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.userID);"
  >
    <template slot="header">
      {{ $t('panel.bookmarkedMessagesHeader') }}
    </template>
    <template slot="subtitle">
      {{ $t('panel.bookmarkedMessagesSubtitle') }}
    </template>
    <template slot="main">
      <messages
        :messages="messages"
        :current-user="$auth.user"
        :origin="{ thread: 'bookmarked' }"
        :scrollable="false"
        :highlight-bookmarked="false"
        v-on="$listeners"
      />
    </template>
  </base-panel>
</template>
<script>
import BasePanel from '.'
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

  computed: {
    channelID () {
      return this.channel.channelID
    },
  },

  mounted () {
    this.messagesLoad({
      filter: { bookmarkedOnly: true },
      noCheck: true,
    })
  },

  methods: {
    /**
     * Custom filter used by messages mixin
     * @param {Message} message
     * @returns {Boolean}
     */
    messageFilter (message) {
      return !!message.isBookmarked
    },
  },
}
</script>
