<template>
  <router-link :to="linkProps" :class="{ 'current-user':ID===currentUser.ID }">{{ user | userLabel }}</router-link>
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
      findUserByID: 'users/findByID',
      currentUser: 'auth/user',
    }),

    linkProps () {
      return { to: { name: 'user', params: { ID: this.ID } } }
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
  &.current-user{
    color: $appred;
  }
  &:before {
    content: "@";
  }
}
</style>
