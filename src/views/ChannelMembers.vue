<template>
  <section class="members">
    <a @click="$router.back()" class="closer">&times;</a>
    <h1>{{ $t('channel.members.label') }}</h1>
    <table>
      <tr v-for="u in users" :key="u.ID">
        <td class="right">
          <button @click="remove(u.ID)" v-if="isMember(u.ID)">{{ $t('channel.members.remove') }}</button>
          <button @click="add(u.ID)" v-if="!isMember(u.ID)">{{ $t('channel.members.add') }}</button>
        </td>
        <td>{{ label(u) }}</td>
      </tr>
    </table>
  </section>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  name: 'channel-members',
  props: ['channelID'],

  data () {
    return {
      members: [],
    }
  },

  computed: {
    ...mapGetters({
      users: 'users/list',
    }),

    isMember () {
      return (userID) => !!this.members.find(m => m.userID === userID)
    },
  },

  mounted () {
    this.$messaging.channelMembers({ channelID: this.channelID }).then(members => {
      this.members = members
    }).catch(error => {
      console.error('Failed to load channel members', { error })
    })
  },

  methods: {
    add (userID) {
      this.$messaging.channelJoin({ channelID: this.channelID, userID }).then((members) => {
        this.members = this.members.concat(members)
      })
    },

    remove (userID) {
      this.$messaging.channelPart({ channelID: this.channelID, userID }).then(() => {
        const i = this.members.findIndex(m => m.userID === userID)
        if (i > 0) {
          this.members.splice(i, 1)
        }
      })
    },
  },
}
</script>
<style lang="scss" scoped>
@import '@/assets/sass/_0.commons.scss';

label {
  display:block
}

.right {
  text-align: right
}

</style>
