<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.ID);">
    <template slot="header">Bookmarked messages</template>
    <template slot="main">
      <messages
        :messages="bookmarked"
        :currentUser="currentUser"
        origin="bookmarked"
        :scrollable="false"
        v-on="$listeners" />
    </template>
  </base-panel>
</template>
<script>
import { mapGetters } from 'vuex'
import BasePanel from './'
import Messages from '@/components/Messages'

export default {
  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
      bookmarked: 'history/getBookmarked',
    }),
  },

  mounted () {
    this.$ws.getMessages({ bookmarked: true })
  },

  components: {
    BasePanel,
    Messages,
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
