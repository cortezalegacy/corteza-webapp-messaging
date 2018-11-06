<template>
  <router-link :to="{ name: 'channel', params: { channelID: ID } }">{{ channel ? channel.name : 'N/A' }}</router-link>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    ID: {
      type: String,
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      findChannelByID: 'channels/findByID',
    }),

    channel () {
      return this.findChannelByID(this.ID)
    },
  },
}
</script>
