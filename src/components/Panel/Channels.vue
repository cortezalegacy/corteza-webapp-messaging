<template>
  <nav
    class="menu-layer mobile-modal always-deployed-on-desktop"
    :class="current?'':'no-current'">
    <div class="menu-layer-inner">
      <!-- cant close this if no channel selected-->
      <label class="closer"
        v-if="current"
        @click="toggleChannelPanel(false)">
          <i class="icon-close" aria-label="close"></i>
      </label>
      <div class="layer-section-wrapper">
        <div class="layer-item search-item">
          <span class="badge badge-block badge-pill badge-tall">
            <i class="icon-search"></i>
            <input type="text" placeholder="search" class="txt no-border search">
            <i class="icon-settings-horizontal float-right"></i>
          </span>
        </div>
        <!-- one section per "board" (group of channels) -->
        <section class="layer-section">
          <div class="layer-item layer-section-title" @click="publicUnflod=!publicUnflod"><a>Public channels
            <span v-if="publicChannels" class="channel-unfolder">
              <i v-if="publicUnflod" class="icon-chevron-up"></i>
              <i v-else class="icon-chevron-down"></i>
            </span>
            </a></div>
          <ul v-if="publicChannels && publicUnflod">
            <channel-panel-item
                    v-for="(ch, index) in publicChannels"
                    :key="ch.ID"
                    :channel="ch"
                    :index="index"
            ></channel-panel-item>
          </ul>
        </section>

        <div class="layer-item new-channel">
          <router-link :to="{name: 'new-channel', params: { type: 'public' } }">
              <span class="btn btn-dark">
                <i class="btn-i icon-plus"></i><span class="btn-txt">New Public Channel</span></span>
          </router-link>
        </div>

        <section class="layer-section">
          <div class="layer-item layer-section-title" @click="privateUnflod=!privateUnflod"><a>Private channels
            <span v-if="privateChannels" class="channel-unfolder">
              <i v-if="privateUnflod" class="icon-chevron-up"></i>
              <i v-else class="icon-chevron-down"></i>
            </span>
            </a></div>
          <ul v-if="privateChannels && privateUnflod">
            <channel-panel-item
                    v-for="(ch, index) in privateChannels"
                    :key="ch.ID"
                    :channel="ch"
                    :index="index"
            ></channel-panel-item>
          </ul>
        </section>

        <div class="layer-item new-channel">
          <router-link :to="{name: 'new-channel', params: { type: 'private' }}">
              <span class="btn btn-dark">
                <i class="btn-i icon-plus"></i><span class="btn-txt">New Private Channel</span></span>
          </router-link>
        </div>

        <section class="layer-section">
          <div class="layer-item layer-section-title" @click="groupUnflod=!groupUnflod"><a>Groups and direct messages
            <span v-if="groupChannels" class="channel-unfolder">
              <i v-if="groupUnflod" class="icon-chevron-up"></i>
              <i v-else class="icon-chevron-down"></i>
            </span>
            </a></div>
          <ul v-if="groupChannels && groupUnflod">
            <channel-panel-item
              v-for="(ch, index) in groupChannels"
              :key="ch.ID"
              :channel="ch"
              :index="index"
            ></channel-panel-item>
          </ul>
        </section>

          <div class="layer-item new-channel">
            <router-link :to="{name: 'new-channel', params: { type: 'group' }}">
              <span class="btn btn-dark">
                <i class="btn-i icon-plus"></i><span class="btn-txt">New Direct Message</span></span>
            </router-link>
          </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { ChannelPanelItem } from '@/components/Channel'

export default {
  data () {
    return {
      shown: false,
      groupUnflod: true,
      privateUnflod: true,
      publicUnflod: true,
    }
  },

  computed: {
    ...mapGetters({
      privateChannels: 'channels/privateOnly',
      publicChannels: 'channels/publicOnly',
      groupChannels: 'channels/groupsOnly',
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
.search-item
{
  padding-right:10%;
}
.channel-unfolder
{
  float:right;
  font-size:18px;
}

</style>
