<template>
  <router-link
    :to="{ name: 'channel', params: { channelID: ID } }"
    @click.native="$emit('click', $event)"
  >
    <slot>
      <channel-label
        :channel="channel"
        :users="users"
      />
    </slot>
  </router-link>
</template>
<script>
import { mapGetters } from 'vuex'
import ChannelLabel from 'corteza-webapp-messaging/src/components/Channel/ChannelLabel'

export default {
  components: {
    ChannelLabel,
  },

  props: {
    ID: {
      type: String,
      required: true,
    },
    users: {
      type: Object,
      default: () => ({}),
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

<style scoped lang="scss">
a{
  color: $dark;
  font-weight: 900;
  &:before {
    content: "#";
  }
}
</style>
