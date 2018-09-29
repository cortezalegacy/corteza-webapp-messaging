<template>
  <div class="crust_iam-channel_members crust_sliding_menu" @onclick="$emit('openDirectMessage', u.ID);">
    <label class="crust_hide-iam-members crust-closer"
           @click="toggleUserPanel(false)"><i class="icon-close"><span class="crust_readable_text">close</span></i></label>
    <ul class="crust_iam-channel_member_list" v-if="users">
      <li
        v-for="u in users"
        :key="u.ID"
        @click="$emit('openDirectMessage', u.ID);"
        v-bind:class="[{active:u.connections}, 'crust_iam-channel_member']">
        <user-avatar :user="u" />
        <span class="crust_iam-channel_member_name">{{ u.name || u.username || u.ID }} <i title="connected" class='icon-bubble2' v-if="u.connections"></i></span>
      </li>
    </ul>
  </div>
</template>
<script>
import { mapActions, mapGetters } from 'vuex'
import Avatar from '@/components/Avatar'

export default {
  name: 'panel-user',
  data () {
    return {}
  },

  computed: {
    ...mapGetters({
      users: 'messagingUsers/list'
    })
  },

  // beforeCreate () {
  //   // Handle users payload when it gets back
  //   this.$ws.subscribe('users', (users) => {
  //     this.resetList(users)
  //   })
  // },

  // mounted () {
  //   // Ask server to feed us the users we know
  //   this.$ws.users()
  // },

  methods: {
    ...mapActions({
      resetList: 'messagingUsers/resetList',
      toggleUserPanel: 'messagingUi/toggleUserPanel'
    })
  },

  components: {
    'user-avatar': Avatar
  }
}
</script>

<style scoped>
.crust_sliding_menu {
  top: 35px;
  width: 20vw;
}

li:hover {
  background: lightblue;
}
</style>
