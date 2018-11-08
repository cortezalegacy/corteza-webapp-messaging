<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.ID);">
    <template slot="header">Pinned messages</template>
    <template slot="subtitle">in <channel-name :channel="channel"></channel-name></template>
    <template slot="main">
      <messages
        :messages="pinned"
        :currentUser="currentUser"
        origin="pinned"
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
  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
      allPinned: 'history/getPinned',
    }),

    pinned () {
      return this.allPinned.filter(m => m.channelID === this.channel.ID)
    },
  },

  mounted () {
    this.$ws.getMessages({ pinned: true, channelID: this.channelID })
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
