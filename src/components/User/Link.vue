<template>
  <router-link :to="linkProps">{{ user | userLabel }}</router-link>
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
