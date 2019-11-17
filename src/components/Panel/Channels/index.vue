<template>
  <nav>
    <search-input
      :focus="true"
      v-on="$listeners"
    />

    <div class="scrollable">
      <div class="shortcuts">
        <ul>
          <li @click="gotoAndClose({name: 'threads'})">
            <i class="icon icon-left icon-Fichier-2" />{{ $t('panel.threads') }}
          </li>
          <!--<li @click="gotoAndClose({name: 'unreads'})">-->
          <!--<i class="icon icon-left icon-bell2"></i>All unreads-->
          <!--</li>-->
        </ul>
      </div>

      <group
        v-if="unreadChannels.length > 0"
        :list="unreadChannels"
        :current="channel"
        class="channel-group"
        v-on="$listeners"
      >
        {{ $t('panel.unreadMessages') }}
      </group>

      <group
        v-if="pinnedChannels.length > 0"
        :list="pinnedChannels"
        :current="channel"
        class="channel-group"
        v-on="$listeners"
      >
        {{ $t('panel.pinned') }}
      </group>

      <group
        :link="{name: 'new-channel', params: { type: 'public' } }"
        :list="publicChannels"
        :can-create="canCreatePublicChannel"
        :current="channel"
        class="channel-group"
        v-on="$listeners"
      >
        {{ $t('panel.channel.public') }}
      </group>

      <div class="browse">
        <a @click="$emit('openQuickSearch')">+ {{ $t('panel.channel.browse') }}</a>
      </div>

      <group
        :link="{name: 'new-channel', params: { type: 'private' } }"
        :list="privateChannels"
        :can-create="canCreatePrivateChannel"
        :current="channel"
        v-on="$listeners"
      >
        {{ $t('panel.channel.private') }}
      </group>

      <group
        :link="{name: 'new-channel', params: { type: 'group' } }"
        :list="groupChannels"
        :can-create="canCreateGroupChannel"
        :current="channel"
        v-on="$listeners"
      >
        {{ $t('panel.channel.group') }}
      </group>

      <!-- Temporary -->
      <router-link
        v-if="$store.getters['ui/isCordovaPlatform']"
        :to="{ name: 'auth:logout' }"
      >
        Log out
      </router-link>
    </div>
  </nav>
</template>

<script>
import { mapGetters } from 'vuex'
import Group from 'corteza-webapp-messaging/src/components/Panel/Channels/Group'
import SearchInput from 'corteza-webapp-messaging/src/components/SearchInput'

export default {
  components: {
    Group,
    SearchInput,
  },

  props: {
    searchQuery: {
      type: String,
      required: false,
      default: undefined,
    },

    channel: {
      type: Object,
      required: false,
      default: undefined,
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
      isPresent: 'users/isPresent',
      findUserByID: 'users/findByID',
      channels: 'channels/list',
      unreadFinder: 'unread/find',
      canCreateGroupChannel: 'session/canCreateGroupChannel',
      canCreatePrivateChannel: 'session/canCreatePrivateChannel',
      canCreatePublicChannel: 'session/canCreatePublicChannel',
    }),

    // Returns filtered list of channels
    filteredChannels () {
      const { userID } = this.$auth.user
      return this.channels.filter(c => c && (
        // Always show current channel on the list
        (this.channel && this.channel.channelID === c.channelID) ||

        // Unless hidden, show channels we're members of
        ((c.isFeatured() || c.isMember(userID)) && c.membershipFlag !== 'hidden') ||

        // Unless ignored, show channels with unread messages we're members of
        ((c.isFeatured() || c.isMember(userID)) && c.membershipFlag !== 'ignored' && this.unread(c).has) ||

        // and ignore the rest...
        false
      ))
    },

    unreadChannels () {
      return this.channelSlicer(this.filteredChannels.filter(c => this.unread(c).has), this.sortByOnlineStatus)
    },

    readChannels () {
      return this.filteredChannels.filter(c => !this.unread(c).has)
    },

    pinnedChannels () {
      return this.channelSlicer(this.readChannels.filter(c => c.isPinned()), this.sortByOnlineStatus)
    },

    // no unreads, not pinned
    unpinnedChannels () {
      return this.readChannels.filter(c => !c.isPinned())
    },

    publicChannels () {
      return this.channelSlicer(this.unpinnedChannels.filter(c => c.isPublic()), this.sortChannelByName)
    },

    privateChannels () {
      return this.channelSlicer(this.unpinnedChannels.filter(c => c.isPrivate()), this.sortChannelByName)
    },

    groupChannels () {
      return this.channelSlicer(this.unpinnedChannels.filter(c => c.isGroup()), this.sortByOnlineStatus)
    },
  },

  methods: {
    gotoAndClose (params) {
      this.$emit('close')

      if (params) {
        this.$router.push(params)
      }
    },

    unread (ch) {
      const { count = 0, threadCount = 0 } = this.unreadFinder(ch) || {}
      return {
        count,
        threadCount,
        has: threadCount + count > 0,
      }
    },

    // Sorts channels: 1) valid channels, directs with everyone online, some online, all offline and others
    channelSlicer (cc, sortFn) {
      const presenceFilter = (c, cnd) => {
        const present = c.members.filter(m => this.isPresent(m)).length

        switch (cnd) {
          case 'everyone':
            return present === c.members.length
          case 'some':
            return present > 0 && present < c.members.length
          case 'none':
            return present === 0
        }
      }

      const valid = cc.filter(c => c.isValid())
      const validChan = valid.filter(c => !c.isGroup())
      const validDirectEveryoneOnline = valid.filter(c => c.isGroup() && presenceFilter(c, 'everyone'))
      const validDirectSomeOnline = valid.filter(c => c.isGroup() && presenceFilter(c, 'some'))
      const validDirectAllOffline = valid.filter(c => c.isGroup() && presenceFilter(c, 'none'))
      const invalid = cc.filter(c => !c.isValid())

      return [
        // ...pinned.sort(sortFn),
        ...validChan.sort(sortFn),
        ...validDirectEveryoneOnline.sort(sortFn),
        ...validDirectSomeOnline.sort(sortFn),
        ...validDirectAllOffline.sort(sortFn),
        ...invalid.sort(sortFn),
      ]
    },

    sortChannelByName (a, b) {
      return this.getLabel(a).toLocaleLowerCase().localeCompare(this.getLabel(b).toLocaleLowerCase())
    },

    sortByOnlineStatus (a, b) {
      const aLen = a.members.filter(m => this.isPresent(m)).length
      const bLen = b.members.filter(m => this.isPresent(m)).length
      if (aLen !== bLen) return bLen - aLen
      return this.sortChannelByName(a, b)
    },
  },
}
</script>

<style scoped lang="scss">
//inlude generic definitions

nav {
  display: flex;
  flex-flow: column nowrap;
  font-size: 14px;
  overflow: hidden;
  height: 100vh;

  & > form {
    border-bottom: 1px solid $light;
    padding: 10px 20px 10px 10px;
    display: block;
    height: 50px;
  }

  div.scrollable {
    overflow-y: auto;
    flex: 1;
    padding-bottom: 10px;
    box-shadow: inset -10px 0 0 $light;
    padding-right: 10px;

    div.browse {
      padding-top: 0;

      a {
        font-weight: 300;
        cursor: pointer;
        display: block;
        max-width: 100%;
        padding: .35em 0 0 15px;
        line-height: 30px;
      }
    }

    .shortcuts {
      ul {
        margin: 0;
        padding: 0;
        list-style: none;
        line-height: 28px;
        cursor: pointer;

        .icon {
          display: inline-block;
          color: rgba(30, 34, 36, .75);
          font-size: 18px;
          line-height: 14px;
          vertical-align: sub;
          margin: 0 10px 0 10px;
        }
      }
    }
  }

  pre.version {
    margin: 30px 0 0 0;
    padding: 10px;
    color: $secondary;
    font-size: 70%;
  }
}

</style>
