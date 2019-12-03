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

  mounted () {
    this.messagesLoad(this.$MessagingAPI, { bookmarkedOnly: true }, true)
  },
}
</script>
