<template>
  <section class="channel-editor">
    <header class="header">
      <label
        class="closer"
        :aria-label="$t('channel.editor.closeTooltip')"
        @click.prevent="$router.back()"
      ><i class="icon-x" /></label>
      <span
        v-if="channel.type === 'group' && channel.channelID"
        class="title"
      >{{ $t('channel.editor.editGroup') }}</span>
      <span
        v-else-if="channel.type === 'group'"
        class="title"
      >{{ $t('channel.editor.createGroup') }}</span>
      <span
        v-else-if="channel.channelID"
        class="title"
      >{{ $t('channel.editor.editChannel') }}</span>
      <span
        v-else
        class="title"
      >{{ $t('channel.editor.createChannel') }}</span>
    </header>
    <main class="container">
      <form
        v-if="!channel.channelID || channel.type !== 'group'"
        class="editor big-form"
        @submit.prevent="onSubmit"
      >
        <div
          v-if="error"
          class="notification error no-margin"
        >
          <p>{{ $t(error) }}</p>
          <span
            class="close"
            @click="error=null"
          />
        </div>
        <div
          v-if="channel.type !== 'group'"
          class="input-wrap"
        >
          <label class="label-block">{{ $t('channel.editor.channelNameLabel') }} *</label>
          <input
            v-model.trim="channel.name"
            class="input-txt input-block name"
            name="name"
            required
            :disabled="!channel.canUpdate"
            autocomplete="channel-name"
            :placeholder="$t('channel.editor.channelNamePlaceholder')"
          >
        </div>

        <div
          v-if="channel.type !== 'group'"
          class="input-wrap"
        >
          <label class="label-block">{{ $t('channel.editor.channelTopicLabel') }}</label>
          <input
            v-model.trim="channel.topic"
            class="input-txt input-block"
            name="topic"
            :disabled="!channel.canUpdate"
            autocomplete="channel-topic"
            :placeholder="$t('channel.editor.channelTopicPlaceholder')"
          >
        </div>

        <div
          v-if="canMakePrivate"
          class="form-check test-private-ch"
        >
          <input
            id="channel-type"
            v-model="channel.type"
            class="input-chk"
            type="checkbox"
            :disabled="!channel.canUpdate"
            true-value="private"
            false-value="public"
          >
          <label for="channel-type">
            {{ $t('channel.editor.channelPrivateLabel') }}
          </label>
        </div>

        <div class="form-check">
          <input
            id="channel-membership-policy"
            v-model="channel.membershipPolicy"
            class="input-chk"
            type="checkbox"
            :disabled="channel.type !== 'public' || !channel.canChangeMembershipPolicy"
            true-value="featured"
            false-value=""
          >
          <label for="channel-membership-policy">
            {{ $t('channel.editor.channelMembershipPolicyFeatured') }}
          </label>
        </div>
        <div class="members">
          <!-- Add members section -->
          <div class="add-members">
            <label>
              {{ $t('channel.editor.addMembersLabel') }}
            </label>

            <vue-select
              class="user-search"
              :filterable="false"
              :options="filterResults()"
              option-value="userID"
              :get-option-label="o => o.label"
              :placeholder="$t('channel.editor.addMembersPlaceholder')"
              :close-on-select="false"
              @search="onQuery"
              @input="onMemberSelect"
            />
          </div>
          <!-- selected members section -->
          <div class="selected-members">
            <template v-if="members.length > 0">
              <label>
                {{ $t('channel.editor.selectedMembersLabel') }}
              </label>
              <ul class="members showcase">
                <member-item
                  v-for="u in members"
                  :key="u.userID"
                  :user="u"
                  @removeMember="onRemoveMember"
                />
              </ul>
            </template>
          </div>
        </div>

        <div class="actions">
          <button
            v-if="channel.channelID && channel.canUpdate"
            class="btn btn-green"
          >
            {{ $t('channel.editor.update') }}
          </button>
          <button
            v-if="!channel.channelID"
            class="btn btn-green"
          >
            {{ $t('channel.editor.create') }}
          </button>
          <button
            class="btn"
            @click.prevent="$router.back()"
          >
            {{ $t('channel.editor.close') }}
          </button>
        </div>
      </form>

      <div v-if="channel.channelID">
        <confirmation-row
          v-if="!channel.archivedAt && channel.canArchive"
          class="toggle-state"
          cta="Archive"
          @confirmed="updateChannelState('archive')"
        >
          {{ $t('notification.channel.archiveChannel') }}
        </confirmation-row>

        <confirmation-row
          v-if="channel.archivedAt && channel.canArchive"
          class="toggle-state"
          cta="Unarchive"
          cta-class="info"
          @confirmed="updateChannelState('unarchive')"
        >
          {{ $t('notification.channel.unArchive') }}
        </confirmation-row>

        <confirmation-row
          v-if="!channel.deletedAt && channel.canDelete"
          class="toggle-state"
          cta="Delete"
          @confirmed="updateChannelState('delete')"
        >
          {{ $t('notification.channel.delete') }}
        </confirmation-row>

        <confirmation-row
          v-if="channel.deletedAt && channel.canDelete"
          class="toggle-state"
          cta="Undelete"
          cta-class="info"
          @confirmed="updateChannelState('undelete')"
        >
          {{ $t('notification.channel.unDelete') }}
        </confirmation-row>
      </div>
    </main>
  </section>
</template>
<script>
import { Channel, User } from 'corteza-webapp-messaging/src/types'
import { mapMutations } from 'vuex'
import ConfirmationRow from 'corteza-webapp-messaging/src/components/Form/ConfirmationRow'
import users from 'corteza-webapp-messaging/src/mixins/users'
import MemberItem from 'corteza-webapp-messaging/src/components/Channel/MemberItem'
import { throttle } from 'lodash'
import { VueSelect } from 'vue-select'

export default {
  name: 'ChannelEditor',

  components: {
    VueSelect,
    ConfirmationRow,
    MemberItem,
  },

  mixins: [
    users,
  ],

  props: {
    channelID: {
      type: String,
      default: undefined,
    },
    type: {
      type: String,
      default: undefined,
    },
  },

  data () {
    return {
      channel: new Channel(),
      // Needed for diffing
      oldMembers: [],
      error: null,
      fetchedUsers: [],
    }
  },

  computed: {
    /**
     * Provides user objects for channel members
     * @returns {Array<User>}
     */
    members () {
      return this.channel.members.map(m => this.users[m]).filter(m => m)
    },

    /**
     * Determines if a given user can mark this channel as private
     * @returns {Boolean}
     */
    canMakePrivate () {
      return this.channel.type !== 'group' && this.$store.getters['session/canCreatePrivateChannel']
    },
  },

  watch: {
    channelID: {
      handler: function (channelID) {
        this.load(channelID)
      },
      immediate: true,
    },

    'type' (newType) {
      if (!this.channel.channelID) {
        this.load()
      }
    },
  },

  methods: {
    ...mapMutations({
      removeChannelFromList: 'channels/removeFromList',
    }),

    /**
     * Filter fetched users
     * @returns {Array<User>}
     */
    filterResults () {
      return this.fetchedUsers.filter(({ userID }) => !this.users[userID])
    },

    /**
     * Helper to remove the given member from the given channel
     * @param {User} u The user in question
     */
    onRemoveMember (u) {
      this.channel.removeMember(u)
    },

    /**
     * Prepare data to edit this channel. If channel is not defined,
     * then create a new Channel object
     * @param {String} channelID Channel in question
     */
    load (channelID) {
      if (channelID) {
        // Load channel to edit
        this.$MessagingAPI.channelRead({ channelID }).then((ch) => {
          this.channel = new Channel(ch)
          this.oldMembers = [...this.channel.members]
          this.getUsers(this.channel)
        }).catch((error) => {
          console.error('Failed to load channel info', { error })
        })
      } else {
        // Create a new channel
        this.channel = new Channel()
        this.oldMembers = []
        if (this.type) {
          this.channel.type = this.type
        }
      }
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
        .then(({ set: users = [] }) => {
          this.fetchedUsers = (users || []).filter(({ userID }) => !this.users[userID]).map(u => new User(u))
        })
    }, 500),

    // moving channels between deleted, undeleted, archived, unarchived states
    updateChannelState (state) {
      this.$MessagingAPI.channelState({ channelID: this.channel.channelID, state }).then((ch) => {
        this.channel = new Channel(ch)
        this.oldMembers = [ ...this.channel.members ]
      }).catch(({ message }) => {
        this.error = message
      })
    },

    /**
     * Create or update the given channel
     */
    onSubmit () {
      if (this.channel.channelID) {
        this.channelUpdate(this.channel, this.oldMembers)
      } else {
        this.channelCreate(this.channel)
      }
    },

    /**
     * Creates a new channel
     * @param {Channel} channel The channel to be created
     */
    channelCreate (channel) {
      this.$MessagingAPI.channelCreate(this.channel).then((ch) => {
        this.$store.commit('channels/updateList', ch)
        this.$router.push({ name: 'channel', params: { channelID: ch.channelID } })
      }).catch(({ error }) => {
        this.error = error
      })
    },

    /**
     * Updates the given channel & it's members
     * @param {Channel} channel The channel to be updated
     * @param {Array<String>} oldMembers Previous memberships
     */
    async channelUpdate (channel, oldMembers = []) {
      // Determine members delta
      const joined = channel.members.filter(m => !oldMembers.includes(m))
      const parted = oldMembers.filter(m => !channel.members.includes(m))

      for (const m of joined) {
        await this.$MessagingAPI.channelJoin({ channelID: channel.channelID, userID: m })
      }
      for (const m of parted) {
        await this.$MessagingAPI.channelPart({ channelID: channel.channelID, userID: m })
      }

      // Update channel
      this.$MessagingAPI.channelUpdate(this.channel).then((ch) => {
        this.$store.commit('channels/updateList', ch)
        this.$router.push({ name: 'channel', params: { channelID: this.channelID } })
      }).catch((error) => {
        this.error = error.message
      })
    },

    /**
     * Add member to the channel
     * @param {User} user The user to add
     */
    onMemberSelect (user) {
      if (!user) {
        return
      }

      this.$set(this.users, user.userID, user)
      this.channel.members.push(user.userID)
    },
  },
}
</script>

<style scoped lang="scss">
@import 'corteza-webapp-messaging/src/themes/corteza-base/inputs.scss';
@import 'corteza-webapp-messaging/src/themes/corteza-base/headers.scss';
@import 'corteza-webapp-messaging/src/themes/corteza-base/btns.scss';
@import 'corteza-webapp-messaging/src/themes/corteza-base/notifications.scss';

.header {
  .title {
    padding-top: 15px;
  }
}

form, main > section {
  padding: 10px;
}

form {
  .actions {
    text-align: center;
    margin-top: 15px;
    .btn {
      line-height: 16px;
    }
  }
}

.channel-editor {
  height: 100%;
  overflow-y: scroll;

  .header {
    position: sticky;
    top: 0;
    z-index: 1000;
  }
  .toggle-state {
    border-top: 1px solid $secondary;
    font-size: 1.5em;
    padding: 20px 10px 30px 10px;
    margin: 20px;
  }
}

.default-input{
  font-size: 16px;
}

.closer {
  position: relative;
  color: $secondary;
  float: right;
  font-size: 20px;
  font-weight: bold;
  top: 10px;
  right: 10px;
  cursor: pointer;
  line-height: 30px;
}

.label-block{
  font-weight: bold;
  padding-bottom: 10px;
}

.form-check{
  margin-bottom: 30px;
}

.btn{
  font-size: 14px;
}

.members {
  padding: 0;
  margin-top: 5px;

  >div {
    display: inline-block;
    padding: 0 10px;
  }

  &.showcase {
    display: flex;
    flex-wrap: wrap;
  }

  li {
    list-style: none;
    margin: 10px 5px;
    vertical-align: bottom;
  }
}

.select-members{
  /deep/ .input-wrapper{
    input{
      font-size: 16px;
      width: 100%;
      height: 42px;
      padding: 0 0.5em;
      border-radius: 3px;
      border: solid 1px #90A3B1;
      &::placeholder{
        color: #90A3B1;
      }
      &:focus{
        border: 1px solid #1397CB;
      }
    }
  }
  /deep/ .suggestions {
    position: absolute;
    background: $light;
    padding: 0 10px 20px 10px;
    overflow: scroll;
    width: 98%;
    max-height: 200px;
    .suggest-item {
      cursor: pointer;
      padding: 5px 0 0;
        &:hover {
          color: $primary;
        }
    }
  }
}

.selected-members {
  margin-top: 20px;
  width: 100%;
}

@media (max-width: $wideminwidth - 1) {
  .add-members {
    width: 100%;
  }
}

@media (min-width: $wideminwidth) {
  .add-members {
    width: 30%;
  }
}

</style>
