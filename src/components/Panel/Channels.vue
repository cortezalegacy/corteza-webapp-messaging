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
          <input type="text" placeholder="search" class="txt no-border">
          <i class="icon-settings-horizontal float-right"></i>
        </span>
      </div>
      <!-- one section per "board" (group of channels) -->
      <section class="layer-section">
        <div class="layer-item layer-section-title"><a>Channels</a></div>
        <ul v-if="chatChannels">
          <!-- @darh : the color could be set at channel selection -->
          <li
            v-for="(ch, index) in chatChannels"
            :key="ch.ID"
            v-bind:class="[
              'layer-item',
              'layer-selectable',
              'channel-name',
              channelColor(index),
              { current:(current && (ch === current)) },
            ]"
            @click="toggleChannelPanel(false)">
            <router-link
              :to="{name:'channel', params:{channelID:ch.ID}}">{{name(ch)}}</router-link>
            <transition name="slide-fade">
              <span class="unread" v-if="ch.view && ch.view.newMessagesCount > 0">{{ ch.view.newMessagesCount }}</span>
            </transition>
          </li>
        </ul>
      </section>
      <div class="layer-item new-channel">
        <span class="btn btn-dark" @click="$router.push({name: 'new-channel'})">
          <i class="btn-i icon-plus"></i><span class="btn-txt">New Channel</span></span>
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
      chatChannels: 'channels/list',
      current: 'channels/current',
      findUserByID: 'users/findByID',
    }),
  },

  methods: {
    ...mapActions({
      toggleChannelPanel: 'ui/toggleChannelPanel',
    }),

    name (ch) {
      if (ch.type === 'group' && ch.members !== undefined && ch.members.length === 2) {
        const u1 = this.findUserByID(ch.members[0])
        const u2 = this.findUserByID(ch.members[1])

        return (u1.username || u1.ID) + ' & ' + (u2.username || u2.ID)
      } else {
        // juan : removed auto # appended, controlled by css
        return '' + (ch.name || ch.ID)
      }
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
  .channel-name a
  {
    text-decoration:none;
  }

span.unread {
  // @todo apply proper styling
  float: right;
  background: #1397CB;
  color: white;
  border-radius: 10px;
  width: 24px;
  height: 18px;
  font-size: 9px;
  text-align: center;
  padding-top: 3px;
  margin-right: -20px;

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
