<template>
  <div class="crust_iam-channel_members crust_sliding_menu" @onclick="$emit('openDirectMessage', u.ID);">
    <label class="closer"
           @click="toggleUserPanel(false)"
           aria-label="Close"><i class="icon-close"></i></label>
    <ul class="crust_iam-channel_member_list" v-if="users">
      <li
        v-for="u in users"
        :key="u.ID"
        @click="$emit('openDirectMessage', u.ID);"
        v-bind:class="[{active:u.connections}, 'crust_iam-channel_member']">
        <user-avatar :user="u" />
        <span class="crust_iam-channel_member_name">{{ u | userLabel }} <i title="connected" class='icon-bubble2' v-if="u.connections"></i></span>
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
      users: 'users/list',
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

.crust_sliding_menu {
  top:0;
  width:320px;
}

.closer
{
  position:fixed;
  top:5px;
  right:20px;
  font-size:20px;
}

.crust_iam-channel_member_list
{
  list-style : none;
  margin:0;
  padding:20px 0 5px 5px;
}

.crust_iam-channel_member
{
  line-height:30px;
  margin-top:10px;
}
.crust_iam-channel_member_name
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

.crust
{
// mainmenu switch
&_sliding_menu
{
//display:none;
position:fixed;
width:0%;
height:100vh;
max-height:100vh;
overflow-x:hidden;
overflow-y:auto;
background-color:$headerbgcolor;
border-right:solid 1px $defaultlinecolor;
margin:0;
left:0;
top:0;
margin:0;
z-index:2;
-webkit-transition: width 0.5s ease; /* For Safari 3.1 to 6.0 */
transition: width 0.5s ease;
}

&_iam-menu
{
line-height:2rem;
list-style:none;
}

&_iam-menu_item
{
padding:0.2rem 1.5rem;
margin:0;
list-style:none;
}

&_iam-channel_members
{
right:0;
left:auto;
border-right:none;
border-left:solid 1px $defaultlinecolor;
}
}


</style>
