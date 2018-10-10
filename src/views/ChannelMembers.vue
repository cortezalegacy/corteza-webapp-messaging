<template>
  <section class="channel">
    <router-link :to="{ name: 'channel', params: { channelID: channelID } }">&times;</router-link>
    <h1>Members</h1>
    <table>
      <tr v-for="u in users" :key="u.ID">
        <td>{{u.ID}}</td>
        <td>{{u.name}}</td>
        <td>???</td>
        <td>
          <button @click="remove(u.ID)" v-if="isMember(u.ID)">remove</button>
          <button @click="add(u.ID)" v-if="!isMember(u.ID)">add</button>
        </td>
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
  },

  mounted () {
    this.$rest.getMembers(this.channelID).then(members => {
      this.members = members
    }).catch(error => {
      console.error('Failed to load channel members', { error })
    })
  },

  methods: {
    add (userID) {
      this.$rest.addMember(this.channelID, userID).then((members) => {
        this.members = this.members.concat(members)
      })
    },

    remove (userID) {
      this.$rest.removeMember(this.channelID, userID).then(() => {
        const i = this.members.findIndex(m => m.user.ID === userID)
        if (i > 0) {
          this.members.splice(i, 1)
        }
      })
    },

    isMember (userID) {
      return !!this.members.find(m => m.user.ID === userID)
    },
  },
}
</script>
<style scoped>
section {
  padding-left: 30px;
}

label {
  display:block
}

.right {
  text-align: right
}
</style>
