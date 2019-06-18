<template>
  <footer>
    <h3>{{ $t('channel.observing', { label: label(channel) }) }}</h3>
    <button @click="onJoin" class="btn btn-green" v-if="channel.canJoin">{{ $t('channel.join') }}</button>
  </footer>
</template>
<script>
export default {
  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  methods: {
    onJoin () {
      this.$MessagingAPI.channelJoin({ channelID: this.channel.channelID, userID: this.$auth.user.userID })
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
  height: 80px;
  border-top: 2px solid $defaultlinecolor;
  background-color: $white;
}
</style>
