<template>
  <header class="header">
    <label
      class="channel-toggle"
      @click="$emit('toggleChannelPanel', null)">
      <i class="icon-menu4"></i></label>

    <div class="channel-header">
      <span class="channel-name" :class="[channel.type]">{{ label(channel) }}
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
      <span v-if="isOnline" class="is-online">Online</span>
      <span v-else-if="channel.isDirectMessage()" class="is-offline">Offline</span>
      <span v-else-if="channel.isPrivate()" class="topic">Private group</span>
      <span v-else-if="channel.topic" class="topic">
        Topic: {{ channel.topic }}
      </span>
    </div>

    <div>
      <div class="dropdown">
        <label class="dropbtn">
          <font-awesome-icon
            :icon="['fas', 'ellipsis-v']"
            title="Open bookmarks"
            class="dropbtn"
          ></font-awesome-icon>
        </label>
        <div class="dropdown-content">
          <div v-if="!channel.isDirectMessage()">
            <label
              @click="$emit('openMembersPanel')">
              <i title="Members" aria-label="Members" class="icon icon-user"></i>
              Member list ({{ channel.members.length }})
            </label>
            <label v-if="channel.canUpdate"
              @click="$router.push({name: 'edit-channel', params: {channelID: channel.ID}})">
              <i title="Edit channel info" aria-label="Edit channel info" class="icon icon-edit-3"></i>
              Edit channel
            </label>
            <hr>
          </div>
            <label v-if="channel.membershipFlag!=='pinned' && isMember" @click="onFlag('pinned')">
              <font-awesome-icon
                :icon="['fas', 'star']"
                title="Pin channel"
              ></font-awesome-icon>
              Pin channel
            </label>
            <label v-if="channel.membershipFlag!=='hidden' && isMember" @click="onFlag('hidden')">
              <font-awesome-icon
                :icon="['far', 'eye-slash']"
                title="Hide channel"
              ></font-awesome-icon>
              Hide channel
            </label>
            <label v-if="channel.membershipFlag!=='ignored' && isMember" @click="onFlag('ignored')">
              <font-awesome-icon
                :icon="['far', 'bell-slash']"
                title="Ignore channel"
              ></font-awesome-icon>
              Ignore channel
            </label>
            <label v-if="channel.membershipFlag" @click="onFlag('')">
              <font-awesome-icon
                :icon="'eraser'"
                title="Remove channel flag"
              ></font-awesome-icon>
              Remove channel flag
            </label>
          <hr v-if="isMember">
          <div class="open-sidebar">
            <label
              @click="$emit('openBookmarkedMessagesPanel')">
              <font-awesome-icon
                :icon="['far', 'bookmark']"
                title="Open bookmarks"
              ></font-awesome-icon>
              Bookmarked messages
            </label>
            <label
              @click="$emit('openPinnedMessagesPanel')">
              <font-awesome-icon
                icon="thumbtack"
                title="Open pinned messages"
              ></font-awesome-icon>
              Pinned messages
            </label>
          </div>
          <label
            v-if="isMember && channel.canPart"
            @click="onPart">
            <font-awesome-icon
              :icon="'door-open'"
              title="Part channel"
            ></font-awesome-icon>
            Part channel
          </label>
          <label
            v-if="!isMember && channel.canJoin"
            @click="onJoin">
            <font-awesome-icon
              :icon="'door-open'"
              title="Join channel"
            ></font-awesome-icon>
            Join channel
          </label>
        </div>
      </div>
    </div>

  </header>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  name: 'channel-header',

  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      isPresent: 'users/isPresent',
      currentUser: 'auth/user',
    }),

    isOnline () {
      if (this.channel.isDirectMessage()) {
        return this.isPresent(this.channel.members.find(ID => ID !== this.currentUser.ID))
      }
    },

    isMember () {
      return !!this.channel.members.find(ID => ID === this.currentUser.ID)
    },
  },

  methods: {
    onPart () {
      this.$rest.removeMember(this.channel.ID, this.currentUser.ID)
    },

    onJoin () {
      this.$rest.addMember(this.channel.ID, this.currentUser.ID)
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
  @import '@/assets/sass/headers.scss';

  hr {
    background: $appcream;
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
    font-family: $crustsemibold;
    display: block;
    &.public {
      &:before {
        content:"#";
        display:inline-block;
      }
    }
    .svg-inline--fa {
      color: $appgrey;
      vertical-align: inherit;
      font-size: 12px;
      &.fa-star {
        color: $appyellow;
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
    color: $appgrey;
    &:before {
      content: '\25CF';
      font-weight: bold;
      margin-right: 2px;
      color: $appgrey;
    }
  }

  .is-online {
    color: $appgreen;
    &:before {
      color: $appgreen;
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
      color: $appgrey;
    }
    .dropdown-content {
      display: none;
      position: absolute;
      background-color: $appwhite;
      min-width: 160px;
      z-index: 2;
      right: 0;
      top: 50px;
      border-right: 1px solid $appcream;
      box-shadow: 0px 5px 7px -2px rgba(0, 0, 0, 0.4);

      .open-sidebar {
        border-bottom: 1px solid $appcream;
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
