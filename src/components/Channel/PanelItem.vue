<template>
  <li class="layer-item-wrap" :class="[channel.type]" @click="toggleChannelPanel()">
    <router-link
            class="layer-item layer-selectable channel-name"
            v-bind:class="[
              channelColor(index),
              { current: (current||{}).ID === channel.ID },
            ]"
            :to="{name:'channel', params:{channelID:channel.ID}}">
      <channel-name
        :channel="channel"
      ></channel-name>
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
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'channel-panel-item',

  props: [
    'channel',
    'index',
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
    ...mapActions({
      toggleChannelPanel: 'ui/toggleChannelPanel',
    }),

    channelColor (index) {
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

.private .channel-name:before {
  content: 'P';
  font-weight: bold;
}

.group .channel-name:before {
  content: 'G';
  font-weight: bold;
}

.unread
{
  position:absolute;
  top:7px;
  right:5px;
  background: #1397CB;
  color: white;
  border-radius: 10px;
  width: 20px;
  height: 20px;
  line-height: 20px;
  font-size: 9px;
  text-align: center;
  vertical-align: middle;
  display:inline-block;

  pointer-events: none; // make this click through.

  &.slide-fade-enter-active
  {
    transition: all .5s ease;
  }
  &.slide-fade-leave-active
  {
    transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
  }
  &.slide-fade-enter, &.slide-fade-leave-to
  {
    transform: translateX(10px);
    opacity: 0;
  }
}
</style>
