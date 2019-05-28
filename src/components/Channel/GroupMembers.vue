<template>
  <span>
    <span v-if="channel.type !== 'group'">
      {{ labelChannel(channel) }}
    </span>
    <span v-else v-for="(m, index) in members" :key="index" :class="{ 'offline': !m.present }">
      {{ m.label }}<span v-if="index !== members.length - 1">,</span>
    </span>
  </span>
</template>

<script>
export default {
  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  computed: {
    members () {
      return this.$store.getters['channels/otherMembersOf'](this.channel.channelID, this.$auth.user.userID)
        .filter(o => this.$store.getters['users/findByID'](o) !== undefined)
        .map(o => {
          return { label: this.labelUser(o), present: this.$store.getters['users/isPresent'](o) }
        }).sort((a, b) => {
          return b.present - a.present
        })
    },
  },
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

.offline {
  color: $appgrey;
}
</style>
