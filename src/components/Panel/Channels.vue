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
          <channel-panel-item
            v-for="(ch) in chatChannels"
            :key="ch.ID"
            :channel="ch"
            @click="toggleChannelPanel(false)"
          ></channel-panel-item>
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
          <channel-panel-item
            v-for="(ch) in chatGroups"
            :key="ch.ID"
            :channel="ch"
            @click="toggleChannelPanel(false)"
          ></channel-panel-item>
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
import { ChannelPanelItem } from '@/components/Channel'

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
    }),
  },

  methods: {
    ...mapActions({
      toggleChannelPanel: 'ui/toggleChannelPanel',
    }),
  },

  components: {
    ChannelPanelItem,
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

// problem with input ... only on FF59 ubuntu
.search
{
  max-width:calc(100% - 40px);
}
</style>
