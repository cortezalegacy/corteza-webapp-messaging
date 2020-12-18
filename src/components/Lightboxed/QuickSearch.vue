<template>
  <lightbox>
    <header>
      <span
        class="closer"
        @click="onClose"
      >&times;</span>
    </header>
    <main class="quick-search">
      <search-input
        v-model="query"
        :focus="true"
        :placeholder="$t('search.quick.placeholder')"
        @input="onQuery"
      />
      <ol>
        <li
          v-if="query && filtered.length===0"
          class="no-results"
        >
          {{ $t('search.noMatchesFound') }}
        </li>
        <li
          v-for="i in (query ? filtered : preferred).slice(0, 10)"
          :key="i.ID"
          @click="onClose"
        >
          <component
            :is="i.cmp"
            :i-d="i.ID"
            :can-create-group-channel="canCreateGroupChannel"
            :label="i.name"
            :users="users"
          />
        </li>
      </ol>
    </main>
    <i18next
      path="search.quick.footnote"
      tag="footer"
    >
      <kbd>
        {{ $t('search.quick.shortcut') }}
      </kbd>
    </i18next>
  </lightbox>
</template>

<script>
import { Channel, User } from 'corteza-webapp-messaging/src/types'
import { mapGetters } from 'vuex'
import Lightbox from 'corteza-webapp-messaging/src/components/Lightboxed/index.vue'
import SearchInput from 'corteza-webapp-messaging/src/components/SearchInput'
import emitCloseOnEscape from 'corteza-webapp-messaging/src/mixins/emitCloseOnEscape'
import labelsMixin from 'corteza-webapp-messaging/src/mixins/labels'
import users from 'corteza-webapp-messaging/src/mixins/users'

const cmp = (type) => (i) => {
  i.cmp = `${type}-link`
  return i
}

export default {
  components: {
    SearchInput,
    Lightbox,
  },

  mixins: [
    emitCloseOnEscape,
    labelsMixin,
    users,
  ],

  data () {
    return {
      query: '',
      groups: [],
      querriedUsers: [],
      canCreate: false,
    }
  },

  computed: {
    ...mapGetters({
      channels: 'channels/list',
      canCreateGroupChannel: 'session/canCreateGroupChannel',
    }),

    filtered () {
      const q = this.query.toLocaleLowerCase()
      return this.targetNames(this.channelsAndUsers).filter(c => c.name.toLocaleLowerCase().indexOf(q) > -1)
    },

    // List of preferred channels -- ones we're not members of
    preferred () {
      return this.targetNames(this.preferredChannels)
    },

    preferredChannels () {
      return this.channels.filter(c => !c.isDirectMessage() && !c.isMember(this.$auth.user.userID)).map(cmp('channel'))
    },

    channelsAndUsers () {
      return [
        ...this.querriedUsers.map(cmp('user')),
        ...this.channels.filter(c => !c.isDirectMessage() && c.type !== 'group').map(cmp('channel')),
        ...this.groups.map(cmp('channel')),
      ]
    },
  },

  created () {
    // Get group members for group label
    const userIDs = new Set()
    this.groups = this.channels.filter(c => !c.isDirectMessage() && c.type === 'group').map(channel => {
      channel.members.map(userID => userIDs.add(userID))
      return channel
    })

    // Set group names
    this.fetchUsers([...userIDs]).then(() => {
      this.groups = this.groups.map(group => {
        return new Channel({ ...group, name: this.labelChannel(group, this.users) })
      })
    })
  },

  methods: {
    onClose () {
      this.$emit('close')
    },

    /**
     * Handles query requests
     * @param {String} query Requested query
     */
    onQuery (query) {
      if (!query) {
        return
      }

      // Search users
      this.$SystemAPI.userList(({ query, limit: 15 }))
        .then(({ set = [] }) => {
          this.querriedUsers = (set || []).filter(u => u.userID !== this.$auth.user.userID).map(u => new User(u))
        })
    },

    targetNames (target) {
      return target.map(i => ({
        ID: i.channelID || i.userID,
        name: i.name || this.getLabel(i),
        cmp: i.cmp,
      }))
    },
  },
}
</script>
<style scoped lang="scss">

header {
  height: 50px;
  width: 50vw;

  .closer {
    position: fixed;
    color: $light;
    float: right;
    font-size: 50px;
    top: 10px;
    right: 30px;
    cursor: pointer;
    line-height: 30px;
  }
}
form{
  padding-bottom: 3px;
}
main {
  max-height: 70vh;
  width: 90vw;
  background-color: $white;
  margin: 5vh 0 0 5vw;
  padding: 20px 20px 3px;

  ol {
    list-style-type: none;
    margin: 0;
    padding: 0;
    max-height: 60vh;
    overflow: scroll;

    li {
      margin: 0;
      padding: 0;

      a {
        padding: 10px 20px;
        display: block;

        &:hover {
          background: $light;
        }
      }
    }
  }
}

footer {
  text-align: center;
  width: 90vw;
  background-color: $light;
  border-top: 2px solid $secondary;
  margin: 0 0 0 5vw;
  padding: 10px;
  position: fixed;
}

.no-results{
  text-align: center;
  font-size: 18px;
  padding: 20px;
}

@media (min-width: $confortableminwidth)
{
  footer{
    max-width: 50vw;
    margin: 0 0 0 25vw;
  }
  main{
    max-width: 50vw;
    margin: 15vh 0 0 25vw;
  }
}

</style>
