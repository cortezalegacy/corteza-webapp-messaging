<template>
  <footer>
    <h3>You are viewing #{{ label(channel) }}</h3>
    <button @click="onJoin" class="btn btn-green" v-if="channel.canJoin">Join Channel</button>
  </footer>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  methods: {
    ...mapGetters({
      user: 'auth/user',
    }),

    onJoin () {
      this.$rest.addMember(this.channel.ID, this.user().ID)
    },
  },
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/btns.scss';

footer {
  text-align: center;
  width: 100%;
  height: 90px;
  border-top: 2px solid $defaultlinecolor;
  background-color: $appcream;
}
</style>
