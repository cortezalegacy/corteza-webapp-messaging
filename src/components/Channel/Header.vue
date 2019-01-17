<template>
  <header class="header">
    <label
      class="channel-toggle"
      @click="$emit('toggleChannelPanel', null)">
      <i class="icon-menu4"></i></label>

    <div class="channel-header">
      <div v-if="channel.name" class="toolbox">

      </div>
      <span class="channel-name" :class="[channel.type]">{{ label(channel) }}</span>
      <span v-if="isOnline" class="is-online">Online</span>
      <span v-else-if="isPrivateDirectMessage" class="is-offline">Offline</span>
      <span v-else-if="isDirectMessageGroup" class="topic">Private group</span>
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
          <div v-if="channel.name" class="channel-settings">
            <label
              @click="$router.push({name: 'edit-channel', params: {channelID: channel.ID}})">
              <i title="Edit channel info" aria-label="Edit channel info" class="icon icon-edit-3"></i>
              Edit channel
            </label>
            <label
              @click="$emit('openMembersPanel')">
              <i title="Members" aria-label="Members" class="icon icon-user"></i>
              Member list ({{ channel.members.length }})
            </label>
          </div>
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
      if (this.isPrivateDirectMessage) {
        return this.isPresent(this.channel.members.find(ID => ID !== this.currentUser.ID))
      }
    },
    isPrivateDirectMessage () {
      return (this.channel.members.length === 2 && this.channel.type === 'group')
    },
    isDirectMessageGroup () {
      return (this.channel.members.length > 2 && this.channel.type === 'group')
    },
  },
}
</script>

<style scoped lang="scss">
  @import '@/assets/sass/_0.commons.scss';
  @import '@/assets/sass/headers.scss';

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
  }

  .channel-settings {
    border-bottom: 1px solid $appcream;
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
    .toolbox {
      display: inline;
    }
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
      z-index: 1;
      right: 0;
      top: 50px;
      border-right: 1px solid $appcream;
      box-shadow: 0px 5px 7px -2px rgba(0, 0, 0, 0.4);

      label {
        padding: 10px;
        display: block;
        font-size: 14px;
        .svg-inline--fa,
        .icon {
          margin-right: 3px;
          color: $appblue;
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
