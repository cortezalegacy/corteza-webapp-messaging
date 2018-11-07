<template>
  <footer>
    You can only observe the action here.
    <button @click="onJoin">Join</button>&nbsp;<channel-name :channel="channel" /> to participate
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

footer {
  text-align: center;
  width: 100%;
  height: 80px;
  padding: 30px;
  background-color: $appyellow;
}
</style>
