<template>
  <section class="members">
    <a @click="$router.back()" class="closer">&times;</a>
    <h1>{{ $t('channel.members.label') }}</h1>
    <table>
      <tr v-for="u in users" :key="u.userID">
        <td class="right">
          <button @click="remove(u.userID)" v-if="isMember(u.userID)">{{ $t('channel.members.remove') }}</button>
          <button @click="add(u.userID)" v-if="!isMember(u.userID)">{{ $t('channel.members.add') }}</button>
        </td>
        <td>{{ getLabel(u) }}</td>
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
    this.$MessagingAPI.channelMembers({ channelID: this.channelID }).then(members => {
      this.members = members
    }).catch(error => {
      console.error('Failed to load channel members', { error })
    })
  },

  methods: {
    add (userID) {
      this.$MessagingAPI.channelJoin({ channelID: this.channelID, userID }).then((members) => {
        this.members = this.members.concat(members)
      })
    },

    remove (userID) {
      this.$MessagingAPI.channelPart({ channelID: this.channelID, userID }).then(() => {
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
label {
  display:block
}

.right {
  text-align: right
}

</style>
