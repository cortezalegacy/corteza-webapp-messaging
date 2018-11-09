<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.ID);">
    <template slot="header">Members</template>
    <template slot="subtitle">in
      <channel-name :channel="channel"></channel-name>
    </template>
    <template slot="main">
      <ul v-if="members">
        <li
          v-for="u in members"
          :key="u.ID"
          @click="$emit('openDirectMessage', u.ID);"
          class="channel-member"
          >
          <user-avatar :user="u" />
          <span class="member-name">{{ u | userLabel }}</span>
          <i title="connected" class='message-icon icon-bubble2' v-if="u.connections"></i>
        </li>
      </ul>
    </template>
  </base-panel>
</template>
<script>
import { mapGetters } from 'vuex'
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
.channel-name{
  white-space: nowrap;
  text-overflow: ellipsis;
}
.channel-member
{
  line-height:30px;
  margin-top:10px;
  margin-left:20px;
  cursor: pointer;
}
.member-name
{
  display:inline-block;
  line-height:1;
  max-width:80%;
  overflow:hidden;
  padding-left:10px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.message-icon{
  float: right;
  margin-right: 20px;
  line-height: 30px;
}
li:hover {
  background:rgba($appgrey,0.15);
  border-radius:30px 0 0  30px;
}
</style>
