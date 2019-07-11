<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.userID);">
    <template slot="header">{{ $t('panel.bookmarkedMessagesHeader') }}</template>
    <template slot="subtitle">{{ $t('panel.bookmarkedMessagesSubtitle') }}</template>
    <template slot="main">
      <messages
        :messages="bookmarked"
        :currentUser="$auth.user"
        origin="bookmarked"
        :scrollable="false"
        :highlightBookmarked="false"
        v-on="$listeners" />
    </template>
  </base-panel>
</template>
<script>
import { mapGetters } from 'vuex'
import BasePanel from '.'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import { messagesLoad } from 'corteza-webapp-messaging/src/lib/messenger'

export default {
  components: {
    BasePanel,
    Messages,
  },

  computed: {
    ...mapGetters({
      bookmarked: 'history/getBookmarked',
    }),
  },

  mounted () {
    messagesLoad(this.$MessagingAPI, this.$store.getters['users/findByID'], { bookmarkedOnly: true }).then((msgs) => {
      this.$store.commit('history/updateSet', msgs)
    })
  },
}
</script>
