<template>
  <span>
    <span
      v-for="(m, index) in members"
      :key="index"
      :class="{ 'offline': !m.present }"
    >
      {{ m.label }}<span v-if="index !== members.length - 1">,</span>
    </span>
  </span>
</template>

<script>
export default {
  props: {
    group: {
      type: Object,
      required: true,
    },

    users: {
      type: Object,
      default: () => ({}),
    },
  },

  computed: {
    members () {
      return this.$store.getters['channels/otherMembersOf'](this.group.channelID, this.$auth.user.userID)
        .map(o => {
          const user = this.users[o] || o
          return { label: user.label, present: user.online }
        }).sort((a, b) => {
          return b.present - a.present
        })
    },
  },
}
</script>

<style scoped lang="scss">

.offline {
  color: $secondary;
}
</style>
