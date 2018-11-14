<template>
  <base-panel
    v-on="$listeners"
    @onclick="$emit('openDirectMessage', u.ID);">
    <template slot="header">Members</template>
    <template slot="subtitle">in #{{ label(channel) }}</template>
    <template slot="main">
      <div class="current-members">
        <ul v-if="members">
          <li
            v-for="u in members"
            :key="u.ID"
            @click="$emit('openDirectMessage', u.ID);">
            <user-avatar :user="u" />
            <span class="member-name">{{ label(u) }}</span>
            <confirmation-toggle
              @confirmed="remove(u.ID)"
              cta="Remove"
              v-if="channel.canChangeMembers && u.ID != currentUser.ID"
              class="confirmation-buttons">
            </confirmation-toggle>
          </li>
        </ul>
      </div>
      <hr />
      <div class="add-members">
        <div class="header">
          <h1>Add members</h1>
          <search-input v-model="userQuery" :focus="true"></search-input>
        </div>
        <ul v-if="searchResults">
          <li
            v-for="u in searchResults"
            :key="u.ID">
            <user-avatar :user="u" />
            <span class="member-name">{{ label(u) }}</span>
            <button @click="add(u.ID)" class="btn">Add</button>
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
      currentUser: 'auth/user',
    }),

    members () {
      return this.users.filter(u => this.channel.isMember(u.ID))
    },

    searchResults () {
      return this.users.filter(u => !this.channel.isMember(u.ID) && u.Match(this.userQuery))
    },
  },

  components: {
    SearchInput,
    'user-avatar': Avatar,
    BasePanel,
    ConfirmationToggle,
  },

  methods: {
    add (userID) {
      this.$rest.addMember(this.channel.ID, userID)
    },

    remove (userID) {
      this.$rest.removeMember(this.channel.ID, userID).then(() => {
        this.channel.removeMember(userID)
      })
    },

    isMember (userID) {
      return !!this.members.find(m => m.user.ID === userID)
    },
  },
}
</script>

<style scoped lang="scss">
//inlude generic definitions
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/menu-layer.scss';
@import '@/assets/sass/btns.scss';

div {
  &.current-members,
  &.add-members {
    position: relative;
    overflow: scroll;
    height: auto;
    height: calc((100vh - 80px) / 2);
  }

  &.add-members {
    .header {
      background: white;
      padding-bottom: 5px;
      z-index: 1;
      width: 360px;

      h1 {
        margin: 10px 10px;
      }

      form {
        padding: 0 0 10px 5px;
        width: 300px;
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
        border-radius: 30px 0 0 30px;
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
