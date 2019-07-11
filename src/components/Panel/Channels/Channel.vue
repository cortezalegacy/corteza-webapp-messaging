<template>
  <li class="layer-item-wrap" :class="cssClass" @click="$emit('close')">
    <router-link v-if="channel.membershipFlag==='ignored'"
                 class="ignored layer-item layer-selectable channel-name"
                 :to="{name:'channel', params:{channelID:channel.channelID}}">
      <label>
        <font-awesome-icon
          :icon="['far', 'bell-slash']"
        ></font-awesome-icon>
      </label>
      <channel-label :channel="channel" />
    </router-link>
    <router-link v-else
                 class="layer-item layer-selectable channel-name"
                 :class="[channelColor(index), { current: (current||{}).channelID === channel.channelID }]"
                 :to="{name:'channel', params:{channelID:channel.channelID}}">
      <channel-label :channel="channel"/>
    </router-link>
    <transition v-if="unread.count || unread.tcount"
                name="slide-fade">
        <span class="unread" v-if="unread.count > maxUnread">{{ maxUnread }}+</span>
        <span class="unread" v-else-if="unread.count">{{ unread.count }}</span>
        <span class="unread" v-else-if="unread.tcount"><i class="icon-message-circle-left-speak" /></span>
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
import { mapGetters, mapActions } from 'vuex'
import ChannelLabel from 'corteza-webapp-messaging/src/components/Channel/ChannelLabel'

export default {
  components: {
    ChannelLabel,
  },

  props: {
    channel: {
      type: Object,
      required: true,
    },

    current: {
      type: Object,
      required: false,
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
      otherMembersOf: 'channels/otherMembersOf',
      findUserByID: 'users/findByID',
      isPresent: 'users/isPresent',
      unreadFinder: 'unread/find',
    }),

    unread () {
      return this.unreadFinder(this.channel)
    },

    cssClass () {
      let set = [this.channel.type]

      if (this.channel.type === 'group') {
        let online = 0
        this.channel.members.forEach(userID => { if (this.isPresent(userID)) online++ })
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
  },

  methods: {
    ...mapActions({
      setChannelMembershipFlag: 'channels/setMembershipFlag',
      removeChannelMembershipFlag: 'channels/removeMembershipFlag',
    }),

    channelColor (index) {
      const colors = ['blue', 'red', 'green', 'yellow']
      return (colors[index % colors.length])
    },

    onFlag (flag) {
      const { channelID } = this.channel

      if (flag) {
        this.setChannelMembershipFlag({ channelID, flag })
      } else {
        this.removeChannelMembershipFlag({ channelID })
      }
    },
  },
}
</script>
<style scoped lang="scss">
@import 'corteza-webapp-messaging/src/themes/corteza-base/menu-layer.scss';
@import 'corteza-webapp-messaging/src/themes/corteza-base/channel-names.scss';

.channel-name {
  text-decoration:none;
  line-height:20px;
  font-weight: 400;
}

.unread {
  background: $primary;
  color: white;
  display:inline-block;
  pointer-events: none; // make this click through.

  i {
    color: white;
  }
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
  color: $secondary;
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
  color: $secondary;
  font-size: 11px;
  display: none;
  line-height: 22px;
  cursor: pointer;
}

.starred {
  color: $warning;
}

.layer-item-wrap {
  a{
    padding-right: 25px;
  }
  &:hover {
    .channel-name {
      background-color:rgba($secondary,0.15);
      border-color:rgba($secondary,0.5);
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
