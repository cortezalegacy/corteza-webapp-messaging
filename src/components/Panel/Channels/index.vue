<template>
  <nav>
    <search-input
      :focus="true"
      v-on="$listeners" />

    <div class="scrollable">
      <div class="shortcuts">
        <ul>
          <li @click="gotoAndClose({name: 'threads'})">
            <i class="icon icon-left icon-Fichier-2"></i>My threads
          </li>
          <!--<li @click="gotoAndClose({name: 'unreads'})">-->
            <!--<i class="icon icon-left icon-bell2"></i>All unreads-->
          <!--</li>-->
        </ul>
      </div>

      <group v-if="unreadChannels.length > 0"
             v-on="$listeners"
             :list="unreadChannels"
             class="channel-group">Unread messages</group>

      <group v-if="pinnedChannels.length > 0"
        v-on="$listeners"
        :list="pinnedChannels"
        class="channel-group">Pinned</group>

      <group
        v-on="$listeners"
        :link="{name: 'new-channel', params: { type: 'public' } }"
        :list="publicChannels"
        class="channel-group">Public channels</group>

      <div class="browse">
        <a @click="$emit('openQuickSearch')">+ Browse all channels</a>
      </div>

      <group
        v-on="$listeners"
        :link="{name: 'new-channel', params: { type: 'private' } }"
        :list="privateChannels">Private channels</group>

      <group
        v-on="$listeners"
        :link="{name: 'new-channel', params: { type: 'group' } }"
        :list="groupChannels">Direct messages</group>

      <pre
        class="version selectable" v-html="version"></pre>
    </div>

  </nav>
</template>

<script>
import { mapGetters } from 'vuex'
import Group from '@/components/Panel/Channels/Group'
import SearchInput from '@/components/SearchInput'

export default {
  components: {
    Group,
    SearchInput,
  },

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
      isPresent: 'users/isPresent',
      findUserByID: 'users/findByID',
      current: 'channels/current',
      channels: 'channels/list',
      currentUser: 'auth/user',
      countUnread: 'unread/count',
      lastUnread: 'unread/last',
    }),

    filteredChannels () {
      return this.channels.filter(c => c && (
        // Always show current channel on the list
        (this.current && this.current.ID === c.ID) ||

        // Unless hidden, show channels we're members of
        (c.isMember(this.currentUser.ID) && c.membershipFlag !== 'hidden') ||

        // Unless ignored, show channels with unread messages we're members of
        (c.isMember(this.currentUser.ID) && this.countUnread(c) > 0 && c.membershipFlag !== 'ignored') ||

        // and ignore the rest...
        false
      ))
    },

    pinnedChannels () {
      return this.channelSlicer(this.filteredChannels.filter(c => this.countUnread(c) === 0 && c.isPinned()), this.sortByOnlineStatus)
    },

    unreadChannels () {
      return this.channelSlicer(this.filteredChannels.filter(c => this.countUnread(c) > 0), this.sortChannelByName)
    },

    publicChannels () {
      return this.channelSlicer(this.filteredChannels.filter(c => this.countUnread(c) === 0 && c.isPublic() && !c.isPinned()), this.sortChannelByName)
    },

    privateChannels () {
      return this.channelSlicer(this.filteredChannels.filter(c => this.countUnread(c) === 0 && c.isPrivate() && !c.isPinned()), this.sortChannelByName)
    },

    groupChannels () {
      return this.channelSlicer(this.filteredChannels.filter(c => this.countUnread(c) === 0 && c.isGroup() && !c.isPinned()), this.sortByOnlineStatus)
    },

    version () {
      /* eslint-disable no-undef */
      return `<a href="https://github.com/crusttech/webapp-messaging/commit/${CRUST_VERSION}" target="_blank">${CRUST_VERSION}</a>`
    },
  },

  methods: {
    gotoAndClose (params) {
      this.$emit('close')

      if (params) {
        this.$router.push(params)
      }
    },

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
      return this.label(a).toLocaleLowerCase().localeCompare(this.label(b).toLocaleLowerCase())
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
@import '@/assets/sass/_0.commons.scss';

nav {
  display: flex;
  flex-flow: column nowrap;
  font-size: 14px;
  overflow: hidden;
  height: 100vh;

  & > form {
    border-bottom: 1px solid $appcream;
    padding: 10px 20px 10px 10px;
    display: block;
    height: 50px;
  }

  div.scrollable {
    overflow-y: auto;
    flex: 1;
    padding-bottom: 10px;
    box-shadow: inset -10px 0px 0px $mainbgcolor;
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
    color: $appgrey;
    font-size: 70%;
  }
}

</style>
