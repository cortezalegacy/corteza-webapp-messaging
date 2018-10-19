<template>
  <div
    class="menu-layer right">
    <label class="closer"
           @click="toggleUserPanel(false)"
           aria-label="Close"><i class="icon-close"></i></label>
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

.closer {
  position: fixed;
  top: 5px;
  right: 20px;
  font-size: 20px;
}
</style>
