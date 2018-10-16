<template>
  <li class="layer-item-wrap">
    <router-link
            v-bind:class="[
              'layer-item',
              'layer-selectable',
              'channel-name',
              channelColor(channel.ID),
              { current: (current||{}).ID === channel.ID },
            ]"
            :to="{name:'channel', params:{channelID:channel.ID}}">
      <channel-name :channel="channel"></channel-name>
    </router-link>
    <transition name="slide-fade">
      <span>
        <span class="unread" v-if="unread(channel.ID) > 99">99+</span>
        <span class="unread" v-else-if="unread(channel.ID) > 0">{{ unread(channel.ID) }}</span>
      </span>
    </transition>
  </li>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  name: 'channel-panel-item',

  props: [
    'channel',
  ],

  computed: {
    ...mapGetters({
      current: 'channels/current',
      unread: 'unread/channel',
      otherMembersOf: 'channels/otherMembersOf',
      findUserByID: 'users/findByID',
      currentUser: 'auth/user',
    }),
  },

  methods: {
    channelColor (channelID) {
      const index = parseInt(channelID.substr(channelID.length - 1, 1))
      const colors = ['blue', 'red', 'green', 'yellow']
      return (colors[index % colors.length])
    },
  },
}
</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/menu-layer.scss';
@import '@/assets/sass/badges.scss';
@import '@/assets/sass/channel-names.scss';

  // add specific stuff here if desired
.channel-name
{
  text-decoration:none;
  line-height:20px;
  &:hover
  {
    background-color:rgba($appgrey,0.15);
    border-color:rgba($appgrey,0.5);
  }
}

span.unread {
  position:absolute;
  top:10px;
  right:5px;
  background: #1397CB;
  color: white;
  border-radius: 10px;
  width: 24px;
  font-size: 9px;
  text-align: center;
  padding-top: 3px;
  &.slide-fade-enter-active {
    transition: all .5s ease;
  }
  &.slide-fade-leave-active {
    transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
  }
  &.slide-fade-enter, &.slide-fade-leave-to {
    transform: translateX(10px);
    opacity: 0;
  }
}
</style>
