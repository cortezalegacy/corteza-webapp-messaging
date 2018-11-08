<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.ID);">
    <template slot="header">Users</template>
    <template slot="subtitle">in <channel-name :channel="channel"></channel-name></template>
    <template slot="main">
      <ul v-if="members">
        <li
          v-for="u in members"
          :key="u.ID"
          @click="$emit('openDirectMessage', u.ID);">
          <user-avatar :user="u" />
          <span class="member-name">{{ u | userLabel }} <i title="connected" class='icon-bubble2' v-if="u.connections"></i></span>
        </li>
      </ul>
    </template>
  </base-panel>
</template>
<script>
import { mapActions, mapGetters } from 'vuex'
import BasePanel from './'
import Avatar from '@/components/Avatar'

export default {
  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  data () {
    return {}
  },

  computed: {
    ...mapGetters({
      users: 'users/list',
    }),

    members () {
      return this.users.filter(u => this.channel.isMember(u.ID))
    },
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
      resetList: 'users/resetList',
      toggleUserPanel: 'ui/toggleUserPanel',
    }),
  },

  components: {
    'user-avatar': Avatar,
    BasePanel,
  },
}
</script>

<style scoped lang="scss">
  //inlude generic definitions
  @import '@/assets/sass/_0.commons.scss';
  @import '@/assets/sass/menu-layer.scss';

.closer
{
  position:fixed;
  top:5px;
  right:20px;
  font-size:20px;
}

.channel-member
{
  line-height:30px;
  margin-top:10px;
  margin-left:20px;
}
.member-name
{
  display:inline-block;
  line-height:1;
  max-width:80%;
  overflow:hidden;
  padding-left:5px;
}
li:hover {
  background:rgba($appgrey,0.15);
  border-radius:30px 0 0  30px;
}
</style>
