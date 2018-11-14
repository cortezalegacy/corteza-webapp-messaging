<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.ID);">
    <template slot="header">Bookmarked messages</template>
    <template slot="main">
      <messages
        :messages="bookmarked"
        :currentUser="currentUser"
        origin="bookmarked"
        :scrollable="false"
        v-on="$listeners" />
    </template>
  </base-panel>
</template>
<script>
import { mapGetters } from 'vuex'
import BasePanel from '.'
import Messages from '@/components/Messages'

export default {
  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
      bookmarked: 'history/getBookmarked',
    }),
  },

  mounted () {
    this.$ws.getMessages({ bookmarked: true })
  },

  components: {
    BasePanel,
    Messages,
  },
}
</script>
