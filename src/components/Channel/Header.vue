<template>
  <header class="header">
    <label
      class="channel-toggle"
      @click="$emit('toggleChannelPanel', null)">
      <i class="icon-menu4"></i></label>

    <div class="channel-header">
      <span class="channel-name" :class="[channel.type]">
        <channel-label :channel="channel" />
        <span v-if="channel.membershipFlag==='pinned'" @click="onFlag('')">
          <label>
            <font-awesome-icon
              :icon="['fas', 'star']"
            ></font-awesome-icon>
          </label>
        </span>
        <span v-else-if="channel.membershipFlag==='hidden'" @click="onFlag('')">
          <label>
            <font-awesome-icon
              :icon="['far', 'eye-slash']"
            ></font-awesome-icon>
          </label>
        </span>
        <span v-else-if="channel.membershipFlag==='ignored'" @click="onFlag('')">
          <label>
            <font-awesome-icon
              :icon="['far', 'bell-slash']"
            ></font-awesome-icon>
          </label>
        </span>
      </span>
      <span v-if="isOnline" class="is-online">{{ $t('channel.online') }}</span>
      <span v-else-if="channel.isDirectMessage()" class="is-offline">{{ $t('channel.offline') }}</span>
      <span v-else-if="channel.isPrivate()" class="topic">{{ $t('channel.private') }}</span>
      <span v-else-if="channel.topic" class="topic">
        {{ $t('channel.topic', { topic: channel.topic }) }}
      </span>
    </div>

    <div>
      <div class="dropdown">
        <label class="dropbtn">
          <font-awesome-icon
            :icon="['fas', 'ellipsis-v']"
            :title="$t('channel.bookmarkedMessagesTooltip')"
            class="dropbtn"
          ></font-awesome-icon>
        </label>
        <div class="dropdown-content">
          <div v-if="!channel.isDirectMessage()">
            <label
              @click="$emit('openMembersPanel')">
              <i :title="$t('channel.memberListTooltip')" :aria-label="$t('channel.memberListTooltip')" class="icon icon-user"></i>
              {{ $t('channel.memberList', { count: (channel.members || []).length }) }}
            </label>
            <label v-if="channel.canUpdate"
              @click="$router.push({name: 'edit-channel', params: {channelID: channel.channelID}})">
              <i :title="$t('channel.editTooltip')" :aria-label="$t('channel.editTooltip')" class="icon icon-edit-3"></i>
              {{ $t('channel.edit') }}
            </label>
            <hr>
          </div>
            <label v-if="channel.membershipFlag!=='pinned' && isMember" @click="onFlag('pinned')">
              <font-awesome-icon
                :icon="['fas', 'star']"
                :title="$t('channel.pinTooltip')"
              ></font-awesome-icon>
              {{ $t('channel.pin') }}
            </label>
            <label v-if="channel.membershipFlag!=='hidden' && isMember" @click="onFlag('hidden')">
              <font-awesome-icon
                :icon="['far', 'eye-slash']"
                :title="$t('channel.hideTooltip')"
              ></font-awesome-icon>
              {{ $t('channel.hide') }}
            </label>
            <label v-if="channel.membershipFlag!=='ignored' && isMember" @click="onFlag('ignored')">
              <font-awesome-icon
                :icon="['far', 'bell-slash']"
                :title="$t('channel.ignoreTooltip')"
              ></font-awesome-icon>
              {{ $t('channel.ignore') }}
            </label>
            <label v-if="channel.membershipFlag" @click="onFlag('')">
              <font-awesome-icon
                :icon="'eraser'"
                :title="$t('channel.removeFlagTooltip')"
              ></font-awesome-icon>
              {{ $t('channel.removeFlag') }}
            </label>
          <hr v-if="isMember">
          <div class="open-sidebar">
            <label
              @click="$emit('openBookmarkedMessagesPanel')">
              <font-awesome-icon
                :icon="['far', 'bookmark']"
                :title="$t('channel.bookmarkedMessagesTooltip')"
              ></font-awesome-icon>
              {{ $t('channel.bookmarkedMessages') }}
            </label>
            <label
              @click="$emit('openPinnedMessagesPanel')">
              <font-awesome-icon
                icon="thumbtack"
                :title="$t('channel.pinnedMessagesTooltip')"
              ></font-awesome-icon>
              {{ $t('channel.pinnedMessages') }}
            </label>
          </div>
          <label
            v-if="isMember && channel.canPart"
            @click="onPart">
            <font-awesome-icon
              :icon="'door-open'"
              :title="$t('channel.leaveTooltip')"
            ></font-awesome-icon>
            {{ $t('channel.leave') }}
          </label>
          <label
            v-if="!isMember && channel.canJoin"
            @click="onJoin">
            <font-awesome-icon
              :icon="'door-open'"
              :title="$t('channel.joinTooltip')"
            ></font-awesome-icon>
            {{ $t('channel.join') }}
          </label>
        </div>
      </div>
    </div>

  </header>
</template>
<script>
import { mapGetters } from 'vuex'
import ChannelLabel from '@/components/Channel/ChannelLabel'

export default {
  name: 'channel-header',

  components: {
    ChannelLabel,
  },

  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      isPresent: 'users/isPresent',
    }),

    isOnline () {
      if (this.channel.isDirectMessage()) {
        return this.isPresent(this.channel.members.find(ID => ID !== this.$auth.user.userID))
      }
    },

    isMember () {
      return !!this.channel.members.find(ID => ID === this.$auth.user.userID)
    },
  },

  methods: {
    onPart () {
      this.$MessagingAPI.channelPart({ channelID: this.channel.channelID, userID: this.$auth.user.userID })
    },

    onJoin () {
      this.$MessagingAPI.channelJoin({ channelID: this.channel.channelID, userID: this.$auth.user.userID })
    },

    onFlag (flag) {
      if (flag) {
        this.$MessagingAPI.channelSetFlag({ channelID: this.channel.channelID, flag })
      } else {
        this.$MessagingAPI.channelRemoveFlag({ channelID: this.channel.channelID })
      }
    },
  },
}
</script>

<style scoped lang="scss">
  @import '@/assets/sass/headers.scss';

  hr {
    background: $light;
    border: none;
    height: 1px;
  }

  .channel-name,
  .topic {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .channel-name {
    font-size:15px;
    font-family: $semibold;
    display: block;
    &.public {
      &:before {
        content:"#";
        display:inline-block;
      }
    }
    .svg-inline--fa {
      color: $secondary;
      vertical-align: inherit;
      font-size: 12px;
      &.fa-star {
        color: $warning;
      }
    }
  }

  .topic,
  .is-offline,
  .is-online {
    font-size: 11px;
    display: block;
  }

  .channel-header {
    max-width:calc(100% - 80px);
    float:left;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  .channel-toggle
  {
    font-size:24px;
    float:left;
    line-height: 20px;
    width: 40px;
    margin:0;
    margin-left:-10px;
    text-align:center;
    border:none;
    padding-top:15px;
  }

  .is-online,
  .is-offline {
    color: $secondary;
    &:before {
      content: '\25CF';
      font-weight: bold;
      margin-right: 2px;
      color: $secondary;
    }
  }

  .is-online {
    color: $success;
    &:before {
      color: $success;
    }
  }

  .dropdown {
    float: right;
    display: inline-block;
    height: 50px;
    width: 100px;
    .dropbtn {
      float: right;
      height: 50px;
      width: 7px;
      color: $secondary;
    }
    .dropdown-content {
      display: none;
      position: absolute;
      background-color: $white;
      min-width: 160px;
      z-index: 2;
      right: 0;
      top: 50px;
      border-right: 1px solid $light;
      box-shadow: 0px 5px 7px -2px rgba(0, 0, 0, 0.4);

      .open-sidebar {
        border-bottom: 1px solid $light;
      }

      label {
        padding: 10px;
        display: block;
        font-size: 14px;
        .svg-inline--fa,
        .icon {
          margin-right: 3px;
          color: $appblue;
          display: inline-block;
          width: 15px;
          text-align: right;
        }
      }
    }
    &:hover {
      .dropdown-content {
        display: block;
      }
    }
  }

  @media (max-width: $wideminwidth - 1)
  {
    .channel-header{
      margin-left: 45px;
    }
  }

  @media (min-width: $wideminwidth)
  {
    .channel-toggle {
      display:none;
    }
  }

</style>
