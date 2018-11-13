<template>
  <li class="layer-item-wrap" :class="[channel.type, isGroupMemberOnline ? 'member-is-online' : null]" @click="$emit('close')">
    <router-link
            class="layer-item layer-selectable channel-name"
            v-bind:class="[
              channelColor(index),
              { current: (current||{}).ID === channel.ID },
            ]"
            :to="{name:'channel', params:{channelID:channel.ID}}">
      {{ labelChannel(channel) }}
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

  props: {
    channel: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      current: 'channels/current',
      unread: 'unread/channel',
      otherMembersOf: 'channels/otherMembersOf',
      findUserByID: 'users/findByID',
      currentUser: 'auth/user',
    }),

    isGroupMemberOnline () {
      // We don't care about other types or multi-member groups...
      if (this.channel.type !== 'group' || this.channel.members.length > 2) return false

      let memberID = this.channel.members[0]

      if (this.channel.members.length === 2) {
        // Direct message to a single user, find this user and see if he's online
        memberID = this.channel.members.find(ID => ID !== this.currentUser.ID) || {}
      }

      return (this.findUserByID(memberID) || {}).connections > 0
    },
  },
  methods: {
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
  font-weight: 400;
  &:hover
  {
    background-color:rgba($appgrey,0.15);
    border-color:rgba($appgrey,0.5);
  }
}

.group .channel-name:before {
  content: '●';
  font-weight: bold;
  color: $appgrey;
}

.group.member-is-online .channel-name:before {
  color: $appgreen;
}

.member-is-online{
  a{
    color: $defaulttextcolor;
  }
}

.unread
{
  position:absolute;
  top:3px;
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

.layer-item-wrap{
  a{
    padding-right: 20px;
  }
}

//webkit specific hack
@media screen and (-webkit-min-device-pixel-ratio:0)
{
  // unread does not align correctly
  .unread
  {
    font-size:9px;
    line-height:22px;
  }
}
</style>
