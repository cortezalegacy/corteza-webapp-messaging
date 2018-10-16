<template>
  <nav
    class="menu-layer always-deployed-on-desktop"
    :class="current?'':'no-current'">
    <!-- cant close this if no channel selected-->
    <label class="closer"
      v-if="current"
      @click="toggleChannelPanel(false)">
        <i class="icon-close" aria-label="close"></i>
    </label>
    <div class="layer-section-wrapper">
      <div class="layer-item">
        <span class="badge badge-block badge-pill badge-tall">
          <i class="icon-search"></i>
          <input type="text" placeholder="search" class="txt no-border search">
          <i class="icon-settings-horizontal float-right"></i>
        </span>
      </div>
      <!-- one section per "board" (group of channels) -->
      <section class="layer-section">
        <div class="layer-item layer-section-title"><a>Channels</a></div>
        <ul v-if="chatChannels">
          <!-- @darh : the color could be set at channel selection -->
          <li
            class="layer-item-wrap"
            v-for="(ch, index) in chatChannels"
            :key="ch.ID"
            @click="toggleChannelPanel(false)">
            <router-link
              v-bind:class="[
                'layer-item',
                'layer-selectable',
                'channel-name',
                channelColor(index),
                { current: (current||{}).ID === ch.ID },
              ]"
              :to="{name:'channel', params:{channelID:ch.ID}}">{{ ch.name || ch.ID }}</router-link>
            <transition name="slide-fade">
              <!-- @darh added a rule that the count displayed cannot be greater than 100, so it never breaks :) -->
              <span class="unread" v-if="ch.view && ch.view.newMessagesCount > 0">{{ ch.view.newMessagesCount > 100 ? '99+' : ch.view.newMessagesCount }}</span>
            </transition>
          </li>
        </ul>
      </section>

      <div class="layer-item new-channel">
        <router-link :to="{name: 'new-channel'}">
            <span class="btn btn-dark">
              <i class="btn-i icon-plus"></i><span class="btn-txt">New Channel</span></span>
        </router-link>
      </div>

      <section class="layer-section">
        <div class="layer-item layer-section-title"><a>Groups and direct messages</a></div>
        <ul v-if="chatGroups">
          <li
            class="layer-item-wrap"
            v-for="(ch, index) in chatGroups"
            :key="ch.ID"
            @click="toggleChannelPanel(false)">
            <router-link
              v-bind:class="[
                'layer-item',
                'layer-selectable',
                'channel-name',
                channelColor(index),
                { current: (current||{}).ID === ch.ID },
              ]"
              :to="{name:'channel', params:{channelID:ch.ID}}">
              <span v-for="(m, index) in groupMembers(ch)" :key="m.ID"><span if v-if="index > 0">, </span>{{ m | userLabel }}</span>
            </router-link>
            <transition name="slide-fade">
              <span class="unread" v-if="ch.view && ch.view.newMessagesCount > 0">{{ ch.view.newMessagesCount }}</span>
            </transition>
          </li>
        </ul>
      </section>

        <div class="layer-item new-channel">
          <router-link :to="{name: 'new-group'}">
            <span class="btn btn-dark">
              <i class="btn-i icon-plus"></i><span class="btn-txt">New Direct Message</span></span>
          </router-link>
        </div>
    </div>
  </nav>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'panel-channels',
  data () {
    return {
      shown: false,
    }
  },

  computed: {
    ...mapGetters({
      chatChannels: 'channels/listChannels',
      chatGroups: 'channels/listGroups',
      current: 'channels/current',
      findUserByID: 'users/findByID',
      users: 'users/list',
      auth: 'auth/user',
    }),
  },

  methods: {
    ...mapActions({
      toggleChannelPanel: 'ui/toggleChannelPanel',
    }),

    // Return all members of each group sans the current user!
    groupMembers (ch) {
      const currentUserID = this.auth.ID
      return (ch.members || []).filter((memberID) => currentUserID !== memberID).map((memberID) => {
        return this.findUserByID(memberID) || {}
      })
    },

    channelColor (index)
    {
      var colors = ['blue', 'red', 'green', 'yellow']
      return (colors[index % colors.length])
    },
  },
}
</script>

<style scoped lang="scss">
  //inlude generic definitions
  @import '@/assets/sass/_0.commons.scss';
  @import '@/assets/sass/menu-layer.scss';
  @import '@/assets/sass/btns.scss';
  @import '@/assets/sass/inputs.scss';
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
  // problem with input ... only on FF59 ubuntu
  .search
  {
    max-width:calc(100% - 40px);
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
