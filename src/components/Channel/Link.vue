<template>
  <router-link
    @click.native="$emit('click', $event)"
    :to="{ name: 'channel', params: { channelID: ID } }">
    <slot>{{ label(channel) }}</slot></router-link>
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

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
a{
  color: $defaulttextcolor;
/*  color:$appyellow;
  color:$appgreen;
  color:$appblue;*/
  font-weight: 900;
  &:before {
    content: "#";
  }
}
</style>
