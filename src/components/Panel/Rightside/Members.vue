<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.userID);"
  >
    <template slot="header">
      {{ $t('panel.membersHeader') }}
    </template>
    <template
      v-if="channel.type === 'group'"
      slot="subtitle"
    >
      {{ $t('panel.membersGroupSubtitle', { label: getLabel(channel) }) }}
    </template>
    <template
      v-else
      slot="subtitle"
    >
      {{ $t('panel.membersSubtitle', { label: channel.name }) }}
    </template>
    <template slot="main">
      <div
        v-if="canManageMembers"
        class="add-members"
      >
        <vue-select
          class="user-search"
          :filterable="false"
          :options="filterResults()"
          option-value="userID"
          :get-option-label="o => o.label"
          :placeholder="$t('channel.editor.addMembersPlaceholder')"
          :close-on-select="false"
          @search="onQuery"
          @input="onAdd"
        />
      </div>
      <div
        class="current-members"
        :class="{ 'full-height': !canManageMembers }"
      >
        <ul
          v-if="members.length"
          class="members"
        >
          <member-item
            v-for="u in members"
            :key="u.userID"
            class="member-item"
            :user="u"
            variant="list"
            @removeMember="onRemove"
          />
        </ul>
      </div>
    </template>
  </base-panel>
</template>
<script>
import BasePanel from './.'
import { VueSelect } from 'vue-select'
import { User, Channel } from 'corteza-webapp-messaging/src/types'
import users from 'corteza-webapp-messaging/src/mixins/users'
import MemberItem from 'corteza-webapp-messaging/src/components/Channel/MemberItem'
import { throttle } from 'lodash'

export default {
  components: {
    VueSelect,
    BasePanel,
    MemberItem,
  },

  mixins: [
    users,
  ],

  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  data () {
    return {
      query: null,
      ch: null,
      fetchedUsers: [],
    }
  },

  computed: {
    /**
     * Provides user objects for given members
     * @returns {Array<User>}
     */
    members () {
      if (!this.ch) {
        return []
      }
      return this.ch.members.map(m => this.users[m]).filter(u => u)
    },

    /**
     * Determines if channel's members can be managed
     * @returns {Boolean}
     */
    canManageMembers () {
      return this.channel.canChangeMembers && this.channel.type !== 'group'
    },
  },

  watch: {
    'channel.channelID': {
      immediate: true,
      handler () {
        this.ch = new Channel(this.channel)
        this.getUsers(this.ch)
      },
    },
  },

  methods: {
    /**
     * Filter fetched users
     * @returns {Array<User>}
     */
    filterResults () {
      // If user is not a member of this channel
      return this.fetchedUsers.filter(({ userID }) => !this.ch.members.find(u => u === userID))
    },

    /**
     * Handles query requests
     * @param {String} query Requested query
     */
    onQuery: throttle(function (query) {
      if (!query) {
        return
      }
      this.$SystemAPI.userList(({ query, limit: 15 }))
        .then(({ set = [] }) => {
          this.fetchedUsers = (set || []).filter(({ userID }) => !this.users[userID]).map(u => new User(u))
        })
    }, 500),

    /**
     * Adds the given user as a member to this channel
     * @param {User} user User to add
     */
    onAdd (user) {
      const { userID } = user
      const { channelID } = this.ch

      // Add new member to store
      this.$MessagingAPI.channelJoin({ channelID, userID }).then(c => {
        if (!this.ch.members.includes(userID)) {
          this.ch.members.push(userID)
        }
        this.$set(this.users, userID, user)
      })
    },

    /**
     * Removes the given user from channel members
     * @param {User} user User to remove
     */
    onRemove (user) {
      const { userID } = user
      const { channelID } = this.ch
      this.$MessagingAPI.channelPart({ channelID, userID }).then(c => {
        this.ch.members = this.ch.members.filter(u => u !== userID)
        this.$delete(this.users, userID)
      })
    },
  },
}
</script>

<style scoped lang="scss">
.header {
  height: auto;
}
.add-members {
  height: 50px;

  .user-search {
    padding: 5px 5px;
    padding-bottom: 10px;
    border-bottom: 1px solid $secondary;
  }
}
.current-members {
  height: 100%;
  overflow-y: scroll;

  &:not(.full-height) {
    height: calc(100% - 50px);
  }
}

.members {
  list-style: none;
  margin: 0;
  padding: 0;

  .member-item {
    padding: 5px;

    &:hover {
      background: rgba($secondary, 0.15);
    }
  }
}

</style>
