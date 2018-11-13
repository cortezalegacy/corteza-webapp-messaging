<template>
  <nav
    class="menu-layer mobile-modal always-deployed-on-desktop"
    :class="current?'':'no-current'">
    <div class="layer-section-wrapper search-section">
      <search-input
        :focus="true"
        v-on="$listeners" />
    </div>
    <div class="menu-layer-inner">
      <div class="layer-section-wrapper">
        <section class="layer-section shortcuts">
          <div class="layer-item layer-section-title" @click="gotoAndClose({name: 'threads'})">
            <i class="icon icon-left icon-Fichier-2"></i>My threads
          </div>
          <div class="layer-item layer-section-title" @click="gotoAndClose({name: 'unreads'})">
            <i class="icon icon-left icon-bell2"></i>All unreads
          </div>
        </section>
        <!-- one section per "board" (group of channels) -->
        <section class="layer-section">
          <div class="layer-item layer-section-title">
            <router-link :to="{name: 'new-channel', params: { type: 'public' } }">
              <i class="icon icon-left icon-plus btn"></i>
            </router-link>
            <a @click="publicUnfold=!publicUnfold">
              Public channels
              <span v-if="joinedPublicChannels">
                <i v-if="publicUnfold" class="icon-chevron-up"></i>
                <i v-else class="icon-chevron-down"></i>
              </span>
            </a>
          </div>
          <ul v-if="joinedPublicChannels && publicUnfold">
            <panel-item
              v-for="(ch, index) in sort(joinedPublicChannels)"
              :key="ch.ID"
              :channel="ch"
              :index="index"
              v-on="$listeners" />
          </ul>
        </section>

        <div class="layer-item new-channel">
          <a @click="$emit('openQuickSearch')">+ Browse all channels</a>
        </div>

        <section class="layer-section">
          <div class="layer-item layer-section-title">
            <router-link :to="{name: 'new-channel', params: { type: 'private' }}">
              <i class="icon icon-left icon-plus btn"></i>
            </router-link>
            <a @click="privateUnfold=!privateUnfold">
            Private channels
            <span v-if="privateChannels">
              <i v-if="privateUnfold" class="icon-chevron-up"></i>
              <i v-else class="icon-chevron-down"></i>
            </span>
            </a></div>
          <ul v-if="privateChannels && privateUnfold">
            <panel-item
              v-for="(ch, index) in sort(privateChannels)"
              :key="ch.ID"
              :channel="ch"
              :index="index"
              v-on="$listeners" />
          </ul>
        </section>

        <section class="layer-section">
          <div class="layer-item layer-section-title">
            <router-link :to="{name: 'new-channel', params: { type: 'group' }}">
              <i class="icon icon-left icon-plus btn"></i>
            </router-link>
            <a @click="groupUnfold=!groupUnfold">
              Direct messages
              <span v-if="groupChannels">
                <i v-if="groupUnfold" class="icon-chevron-up"></i>
                <i v-else class="icon-chevron-down"></i>
              </span>
            </a>
          </div>
          <ul v-if="groupChannels && groupUnfold">
            <panel-item
        v-for="(ch, index) in sort(groupChannels)"
        :key="ch.ID"
        :channel="ch"
        :index="index"
              v-on="$listeners" />
          </ul>
        </section>
      </div>
    </div>
  </nav>
</template>

<script>
import { mapGetters } from 'vuex'
import PanelItem from '@/components/Channel/PanelItem'
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
    sort (cc) {
      return cc.sort(sortChannels)
    },

    gotoAndClose (params) {
      this.$emit('close')

      if (params) {
        this.$router.push(params)
      }
    },
  },

  components: {
    PanelItem,
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

.shortcuts {
  padding-bottom: 25px;
  padding-left: 8px;
  .layer-item {
    padding-top: 0;
    margin-top: 0;
    padding-bottom: 0;
    line-height: 28px;
  }

}

.search-section {
  padding: 0.35em 10px 5px 10px;
}

// add space at the beginning of the menu layer after search
.menu-layer-inner {
  margin-top: 45px;
  padding-top: 5px;
}

//since search is now fixed we have to have it follow the same rules as the container
// but specifcally.
.menu-layer.display, .menu-layer.force-on, .menu-layer.open {
  .search-section {
    position: fixed;
    top: 0;
    background-color: $appwhite;
    z-index: 2;
    width: 90vw;
    max-width: 250px;
    min-width: 120px;
  }

  // move closer to right of search
  .closer {
    position: absolute;
    top: 40px;
    z-index: 3;
    left: 230px;
  }

}

.icon-plus {
  &.btn {
    padding: 1px;
    float: right;
    margin-right: 10px;
    margin-top: 6px;
    font-size: 12px;
    &:hover{
      background-color: $appgrey;
    }
  }
}

.new-channel{
  padding-top: 0;
  a{
    font-weight: 300;
    cursor: pointer;
  }
}

@media (min-width:$wideminwidth) {
  .menu-layer-inner {
    margin-top: 55px;
    padding-top: 5px;
  }

  .search-section {
    position: fixed;
    top: 0;
    padding-top: 10px;
    left: 0;
    width: 250px;
    background-color: $appwhite;
    z-index: 2;
  }

}

</style>
