<template>
  <li class="layer-item-wrap" :class="cssClass" @click="$emit('close')">
    <router-link v-if="channel.membershipFlag==='ignored'"
                 class="ignored layer-item layer-selectable channel-name"
                 :to="{name:'channel', params:{channelID:channel.ID}}">
      <label>
        <font-awesome-icon
          :icon="['far', 'bell-slash']"
        ></font-awesome-icon>
      </label>
      {{ labelChannel(channel) }}
    </router-link>
    <router-link v-else
                 class="layer-item layer-selectable channel-name"
                 :class="[channelColor(index),
        { current: (current||{}).ID === channel.ID },
      ]"
      :to="{name:'channel', params:{channelID:channel.ID}}">
                  {{ labelChannel(channel) }}
    </router-link>
    <transition v-if="countUnread(channel) > 0"
                name="slide-fade">
        <span class="unread" v-if="countUnread(channel) > maxUnread">{{ maxUnread }}+</span>
        <span class="unread" v-else-if="countUnread(channel) > 0">{{ countUnread(channel) }}</span>
    </transition>
    <span v-else-if="channel.isPinned()" class="starred" @click="onFlag()">
      <font-awesome-icon
        :icon="['fas', 'star']"
        :title="$t('panel.removeStar')"
      ></font-awesome-icon>
    </span>
    <span v-else class="hide" @click="onFlag('hidden')">
      <font-awesome-icon
        :icon="['fas', 'times']"
        :title="$t('panel.hideChannel')"
      ></font-awesome-icon>
    </span>
  </li>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
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
  data () {
    return {
      maxUnread: 99,
    }
  },

  computed: {
    ...mapGetters({
      current: 'channels/current',
      countUnread: 'unread/count',
      otherMembersOf: 'channels/otherMembersOf',
      findUserByID: 'users/findByID',
      currentUser: 'auth/user',
    }),

    cssClass () {
      let set = [this.channel.type]

      if (this.channel.type === 'group') {
        const online = this.channel.members.filter(memberID => (this.findUserByID(memberID) || {}).connections > 0).length
        const total = this.channel.members.length

        if (online === total) {
          set.push('full-moon')
        } else if (online > 1) {
          set.push('last-quarter-moon')
        } else {
          set.push('new-moon')
        }
      }

      return set
    },

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
    onFlag (flag) {
      if (flag) {
        this.$rest.setMembershipFlag(this.channel.ID, flag)
      } else {
        this.$rest.removeMembershipFlag(this.channel.ID)
      }
    },
  },
}
</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/menu-layer.scss';
@import '@/assets/sass/channel-names.scss';

.channel-name {
  text-decoration:none;
  line-height:20px;
  font-weight: 400;
}

.group {
  .channel-name:before {
    content: '●';
    font-weight: bold;
    color: $appgrey;
    font-size: 20px;
    margin-left: -2px;
  }

  &.new-moon {
    a {
      color: $appgrey;
    }
  }

  &.full-moon {
    .channel-name:before {
      color: $appgreen;
    }
  }

  &.last-quarter-moon {
    .channel-name:before {
      content: '○';
      color: $appgreen;
    }
  }
}

.unread {
  background: $appblue;
  color: white;
  display:inline-block;
  pointer-events: none; // make this click through.
}

.unread,
.hide,
.starred {
  position: absolute;
  top:5px;
  right:5px;
  text-align: center;
  vertical-align: middle;
  width: 20px;
  height: 20px;
  line-height: 20px;
  font-size: 9px;
  border-radius: 10px;

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

.ignored {
  color: $appgrey;
  &::before {
    content: "";
    width: 0px;
  }
  label {
    margin-left: -10px;
    font-size: 12px;
    display: inline-block;
    width: 18px;
  }
  &.channel-name {
    &::before {
      content: "";
      width: 0px;
    }
  }
}

.hide,
.starred {
  color: $appgrey;
  font-size: 11px;
  display: none;
  line-height: 22px;
  cursor: pointer;
}

.starred {
  color: $appyellow;
}

.layer-item-wrap {
  a{
    padding-right: 25px;
  }
  &:hover {
    .channel-name {
      background-color:rgba($appgrey,0.15);
      border-color:rgba($appgrey,0.5);
    }
    .hide,
    .starred {
      display: inline-block;
    }
  }
}

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
