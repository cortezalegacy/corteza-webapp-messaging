<template>
  <div
    class="menu-layer right"
    :class="[
      { display : isUserPanelOpen }
    ]"
    @onclick="$emit('openDirectMessage', u.ID);">
    <label class="closer"
           @click="toggleUserPanel(false)"
           aria-label="Close"><i class="icon-close"></i></label>
    <ul v-if="users">
      <li
        v-for="u in users"
        :key="u.ID"
        @click="$emit('openDirectMessage', u.ID);"
        v-bind:class="[{active:u.connections}, 'channel-member']">
        <user-avatar :user="u" />
        <span class="member-name">{{ u | userLabel }} <i title="connected" class='icon-bubble2' v-if="u.connections"></i></span>
      </li>
    </ul>
  </div>
</template>
<script>
import { mapActions, mapGetters } from 'vuex'
import Avatar from '@/components/Avatar'

export default {
  data () {
    return {}
  },

  computed: {
    ...mapGetters({
      users: 'users/list',
      isUserPanelOpen: 'ui/isUserPanelOpen',
    }),
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
