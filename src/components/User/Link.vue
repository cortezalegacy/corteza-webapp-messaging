<template>
  <router-link
    @click="$emit('click', $event)"
    :to="linkProps" :class="{ 'current-user': highlight && ID === currentUser.ID }">
    <slot>{{ label(user) }}</slot>
  </router-link>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    ID: {
      type: String,
      required: true,
    },
    highlight: {
      type: Boolean,
      default: true,
    },
  },

  computed: {
    ...mapGetters({
      findUserByID: 'users/findByID',
      findChannelByMembership: 'channels/findByMembership',
      currentUser: 'auth/user',
    }),

    linkProps () {
      let ch = this.findChannelByMembership(this.ID, this.currentUser.ID)
      if (ch) {
        return { name: 'channel', params: { channelID: ch.ID } }
      } else {
        return { name: 'profile', params: { userID: this.ID } }
      }
    },

    user () {
      return this.findUserByID(this.ID)
    },
  },
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
a{
  color: $defaulttextcolor;
  font-weight: 900;
  text-decoration: none;
  &.current-user{
    color: $appblue;
  }

  &:before {
    content: "@";
    text-decoration: none;
  }
}
</style>
