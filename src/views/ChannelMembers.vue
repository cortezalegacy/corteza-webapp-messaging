<template>
  <section class="members">
    <a @click="$router.back()" class="closer">&times;</a>
    <h1>Members</h1>
    <table>
      <tr v-for="u in users" :key="u.ID">
        <td class="right">
          <button @click="remove(u.ID)" v-if="isMember(u.ID)">remove</button>
          <button @click="add(u.ID)" v-if="!isMember(u.ID)">add</button>
        </td>
        <td>{{u | userLabel }}</td>
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
<style lang="scss" scoped>
@import '@/assets/sass/_0.commons.scss';

label {
  display:block
}

.right {
  text-align: right
}

@media (min-width: $wideminwidth) {
  section.members {
    margin-left:320px;
    max-width:calc(100vw - 320px);

  .history {
    top:62px;
  }
}
}

section.members {
  position:fixed;
  width:100%;
  max-width:100vw;
  left:0;
}
</style>
