<template>
  <nav
    class="menu-layer mobile-modal always-deployed-on-desktop"
    :class="current?'':'no-current'">
    <div class="layer-section-wrapper search-section">
      <search-input
        v-on="$listeners" />
    </div>
    <div class="menu-layer-inner">
      <!-- cant close this if no channel selected-->
      <label class="closer"
        v-if="current"
        @click="toggleChannelPanel(false)">
          <i class="icon-close" aria-label="close"></i>
      </label>
      <div class="layer-section-wrapper">
        <section class="layer-section shortcuts">
          <div class="layer-item layer-section-title"><router-link :to="{name: 'threads'}"><i class="icon icon-left icon-Fichier-2"></i>My threads</router-link></div>
          <div class="layer-item layer-section-title"><router-link :to="{name: 'unreads'}"><i class="icon icon-left icon-bell2"></i>All unreads</router-link></div>
        </section>
        <!-- one section per "board" (group of channels) -->
        <section class="layer-section">
          <div class="layer-item layer-section-title" @click="publicUnfold=!publicUnfold"><a>
            <i class="icon icon-left icon-message-circle"></i>Public channels
            <span v-if="joinedPublicChannels" class="channel-unfolder">
              <i v-if="publicUnfold" class="icon-chevron-up"></i>
              <i v-else class="icon-chevron-down"></i>
            </span>
            </a>
          </div>
          <ul v-if="joinedPublicChannels && publicUnfold">
            <channel-panel-item
                    v-for="(ch, index) in sort(joinedPublicChannels)"
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

          <font-awesome-icon
            icon="search"
            @click="$emit('openQuickSearch')"
          ></font-awesome-icon>
        </div>

        <section class="layer-section">
          <div class="layer-item layer-section-title" @click="privateUnfold=!privateUnfold"><a>
            <i class="icon icon-left icon-fatlock"></i>Private channels
            <span v-if="privateChannels" class="channel-unfolder">
              <i v-if="privateUnfold" class="icon-chevron-up"></i>
              <i v-else class="icon-chevron-down"></i>
            </span>
            </a></div>
          <ul v-if="privateChannels && privateUnfold">
            <channel-panel-item
                    v-for="(ch, index) in sort(privateChannels)"
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
          <div class="layer-item layer-section-title" @click="groupUnfold=!groupUnfold"><a>
            <i class="icon icon-left icon-bubbles"></i>Groups and direct messages
            <span v-if="groupChannels" class="channel-unfolder">
              <i v-if="groupUnfold" class="icon-chevron-up"></i>
              <i v-else class="icon-chevron-down"></i>
            </span>
            </a></div>
          <ul v-if="groupChannels && groupUnfold">
            <channel-panel-item
              v-for="(ch, index) in sort(groupChannels)"
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
import SearchInput from '@/components/SearchInput'

function sortChannels (a, b) {
  if (a.archivedAt && !b.archivedAt) return 1
  if (!a.archivedAt && b.archivedAt) return -1
  // if (!a.deletedAt || !b.deletedAt) return !a.deletedAt - !b.deletedAt
  // if (!a.archivedAt || !b.archivedAt) return !a.archivedAt - !b.archivedAt

  // Make sure named channels are on the top
  if (!a.name) return 1
  if (!b.name) return -1

  return b.name.toLocaleLowerCase() - a.name.toLocaleLowerCase()
}

export default {
  props: {
    searchQuery: {
      type: String,
      required: false,
    },
  },

  data () {
    return {
      shown: false,
      groupUnfold: true,
      privateUnfold: true,
      publicUnfold: true,
    }
  },

  computed: {
    ...mapGetters({
      privateChannels: 'channels/privateOnly',
      publicChannels: 'channels/publicOnly',
      groupChannels: 'channels/groupsOnly',
      current: 'channels/current',
      currentUser: 'auth/user',
      unreadInChannel: 'unread/channel',
    }),

    joinedPublicChannels () {
      // channels/publicOnly returns all public channels,
      // we need to filter out only the ones we're member of
      return this.publicChannels.filter(c => {
        return c && (
          (this.current && this.current.ID === c.ID) ||
          c.isMember(this.currentUser.ID) ||
          this.unreadInChannel(c.ID) > 0)
      })
    },
  },

  methods: {
    ...mapActions({
      toggleChannelPanel: 'ui/toggleChannelPanel',
    }),

    sort (cc) {
      return cc.sort(sortChannels)
    },
  },

  components: {
    ChannelPanelItem,
    SearchInput,
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

.channel-unfolder
{
  float:right;
  font-size:18px;
}

.shortcuts
{
  .layer-item
  {
    padding-top: 0;
    margin-top: 0;
    padding-bottom: 0;
    line-height: 28px;
  }
}

.search-section {
  padding: 10px 20px 0 15px;
}

// add space at the beginning of the menu layer after search
.menu-layer-inner
{
  margin-top:45px;
  padding-top:5px;
}
//since search is now fixed we have to have it follow the same rules as the container
// but specifcally.
.menu-layer.display,
.menu-layer.force-on,
.menu-layer.open
{
  .search-section
  {
    position:fixed;
    top:0;
    background-color:$appwhite;
    z-index:2;
    width:90vw;
    max-width:300px;
    min-width:120px;
  }
  // move closer to right of search
  .closer
  {
    position: absolute;
    top: 35px;
    z-index: 3;
    left: 260px;
  }
}

@media (min-width: $wideminwidth)
{
  .menu-layer-inner
  {
    margin-top:55px;
    padding-top:5px;
  }

  .search-section
  {
    position:fixed;
    top:0;
    padding-top:10px;
    left:0;
    width:300px;
    background-color:$appwhite;
    z-index:2;
  }
}

</style>
