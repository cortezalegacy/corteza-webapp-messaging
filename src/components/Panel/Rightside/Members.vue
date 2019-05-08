<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.userID);">
    <template slot="header">{{ $t('panel.membersHeader') }}</template>
    <template slot="subtitle" v-if="channel.type === 'group'">{{ $t('panel.membersGroupSubtitle', { label: label(channel) }) }}</template>
    <template slot="subtitle" v-else>{{ $t('panel.membersSubtitle', { label: label(channel) }) }}</template>
    <template slot="main">
      <div class="current-members">
        <ul v-if="members">
          <li
            v-for="u in members"
            :key="u.userID"
            @click="$emit('openDirectMessage', u.userID);">
            <user-avatar :user="u" />
            <span class="member-name">{{ label(u) }}</span>
            <confirmation-toggle
              @confirmed="remove(u.userID)"
              :cta="$t('panel.remove')"
              v-if="channel.canChangeMembers && u.userID != $auth.user.userID && channel.type !== 'group'"
              class="confirmation-buttons">
            </confirmation-toggle>
          </li>
        </ul>
      </div>
      <div class="add-members" v-if="channel.canChangeMembers && channel.type !== 'group'">
        <div class="header">
          <h1>{{ $t('panel.add') }}</h1>
          <search-input v-model="userQuery" :focus="true"></search-input>
        </div>
        <ul v-if="searchResults">
          <li
            v-for="u in searchResults"
            :key="u.userID">
            <user-avatar :user="u" />
            <span class="member-name">{{ label(u) }}</span>
            <button @click="add(u.userID)" class="btn">{{ $t('general.label.add') }}</button>
          </li>
        </ul>
      </div>
    </template>
  </base-panel>
</template>
<script>
import { mapGetters } from 'vuex'
import BasePanel from './.'
import Avatar from '@/components/Avatar'
import SearchInput from '../../SearchInput'
import ConfirmationToggle from '@/components/Form/ConfirmationToggle'

export default {
  components: {
    SearchInput,
    'user-avatar': Avatar,
    BasePanel,
    ConfirmationToggle,
  },

  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  data () {
    return {
      userQuery: null,
    }
  },

  computed: {
    ...mapGetters({
      users: 'users/list',
    }),

    members () {
      return this.users.filter(u => this.channel.isMember(u.userID))
    },

    searchResults () {
      return this.users.filter(u => !this.channel.isMember(u.userID) && u.Match(this.userQuery))
    },
  },

  methods: {
    add (userID) {
      this.$messaging.channelJoin({ channelID: this.channel.channelID, userID })
    },

    remove (userID) {
      this.$messaging.channelPart({ channelID: this.channel.channelID, userID })
    },

    isMember (userID) {
      return !!this.members.find(m => m.user.userID === userID)
    },
  },
}
</script>

<style scoped lang="scss">
//inlude generic definitions
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/btns.scss';

.header {
  height: auto;
}

div {
  &.current-members,
  &.add-members {
    position: relative;
    overflow: scroll;
    height: auto;
    height: calc((100vh - 50px) / 2);
  }

  &.add-members {
    border-top: 1px solid $appgrey;
    .header {
      background: white;
      padding-bottom: 5px;

      h1 {
        margin: 10px 10px;
      }

      form {
        padding: 0 5px 10px 5px;
      }
    }
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      line-height: 30px;
      margin-bottom: 10px;
      padding: 0 5px;
      cursor: pointer;

      &:hover {
        background: rgba($appgrey, 0.15);
      }

      .confirmation-buttons, .btn {
        float: right;
      }

      .btn {
        margin-top: 5px;
      }

      .member-name {
        display: inline-block;
        line-height: 1;
        max-width: 60%;
        overflow: hidden;
        padding-left: 10px;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
}

</style>
