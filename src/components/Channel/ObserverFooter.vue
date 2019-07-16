<template>
  <footer>
    <h3>{{ $t('channel.observing', { label: getLabel(channel) }) }}</h3>
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
@import 'corteza-webapp-messaging/src/themes/corteza-base/btns.scss';

footer {
  text-align: center;
  width: 100%;
  height: 80px;
  border-top: 2px solid $secondary;
  background-color: $white;
}
</style>
