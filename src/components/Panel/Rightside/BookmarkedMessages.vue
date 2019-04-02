<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.ID);">
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
import Messages from '@/components/Messages'

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
    // TODO: Crust client
    this.$ws.getMessages({ bookmarked: true })
  },
}
</script>
