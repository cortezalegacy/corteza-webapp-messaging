<template>
  <span v-on:click="emitClick">
      <span v-if="channel.type !== 'group'">{{ channel.name || channel.ID }}</span>
      <span v-if="channel.type === 'group'">
        <span v-for="(m, index) in otherMembersOf(channel.ID, currentUser.ID)" :key="m.ID">
          <span if v-if="index > 0">, </span>{{ findUserByID(m) | userLabel }}
        </span>
      </span>
  </span>
</template>
<script>
import { mapGetters } from 'vuex'


export default {
  name: 'channel-name',

  props: [
    'channel',
  ],

  computed: {
    ...mapGetters({
      otherMembersOf: 'channels/otherMembersOf',
      findUserByID: 'users/findByID',
      currentUser: 'auth/user',
    }),
  },
  methods: {
    // @todo needs wrapper ? or emit directly ?
    emitClick () {
      this.$emit('nameclicked')
    },
  },
}
</script>
