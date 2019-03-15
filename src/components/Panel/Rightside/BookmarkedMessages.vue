<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.ID);">
    <template slot="header">{{ $t('pannel.bookmarkedMessagesHeader') }}</template>
    <template slot="subtitle">{{ $t('pannel.bookmarkedMessagesSubtitle') }}</template>
    <template slot="main">
      <messages
        :messages="bookmarked"
        :currentUser="currentUser"
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
import Messages from '@/components/Messages'

export default {
  components: {
    BasePanel,
    Messages,
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
      bookmarked: 'history/getBookmarked',
    }),
  },

  mounted () {
    this.$ws.getMessages({ bookmarked: true })
  },
}
</script>
