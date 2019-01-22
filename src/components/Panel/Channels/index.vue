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
          <li @click="gotoAndClose({name: 'unreads'})">
            <i class="icon icon-left icon-bell2"></i>All unreads
          </li>
        </ul>
      </div>

      <group
        v-on="$listeners"
        :link="{name: 'new-channel', params: { type: 'public' } }"
        :list="joinedPublicChannels"
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
      countUnread: 'unread/count',
      lastUnread: 'unread/last',
    }),

    joinedPublicChannels () {
      // channels/publicOnly returns all public channels,
      // we need to filter out only the ones we're member of
      return this.publicChannels.filter(c => {
        return c && (
          (this.current && this.current.ID === c.ID) ||
          c.isMember(this.currentUser.ID) ||
          this.countUnread(c) > 0
        )
      })
    },

    version () {
      /* eslint-disable no-undef */
      return `<a href="https://github.com/crusttech/webapp-messaging/commit/${CRUST_VERSION}" target="_blank">${CRUST_VERSION}</a>`
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
    Group,
    SearchInput,
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
    margin: 10px;
  }

  div.scrollable {
    overflow-y: auto;
    flex: 1;
    margin-bottom: 10px;

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
