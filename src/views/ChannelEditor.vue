<template>
  <section>
      <header class="header">
        <label class="closer"
               @click.prevent="$router.back()"
               :aria-label="$t('channel.editor.closeTooltip')"><i class="icon-x"></i></label>
          <span class="title" v-if="channel.type === 'group' && channel.channelID">{{ $t('channel.editor.editGroup') }}</span>
          <span class="title" v-else-if="channel.type === 'group'">{{ $t('channel.editor.createGroup') }}</span>
          <span class="title" v-else-if="channel.channelID">{{ $t('channel.editor.editChannel') }}</span>
          <span class="title" v-else>{{ $t('channel.editor.createChannel') }}</span>
      </header>
      <main class="container">
        <form class="editor big-form" @submit.prevent="onSubmit" v-if="!channel.channelID || channel.type !== 'group'">
          <div v-if="error" class="notification error no-margin">
              <p>{{ $t(error) }}</p>
              <span @click="error=null" class="close"></span>
          </div>
          <div v-if="channel.type !== 'group'" class="input-wrap">
            <label class="label-block">{{ $t('channel.editor.channelNameLabel') }} *</label>
            <input
              class="input-txt input-block name"
              name="name"
              v-model.trim="channel.name"
              required
              :disabled="!channel.canUpdate"
              autocomplete="channel-name"
              :placeholder="$t('channel.editor.channelNamePlaceholder')">
          </div>

          <div v-if="channel.type !== 'group'" class="input-wrap">
            <label class="label-block">{{ $t('channel.editor.channelTopicLabel') }}</label>
            <input
              class="input-txt input-block"
              name="topic"
              v-model.trim="channel.topic"
              :disabled="!channel.canUpdate"
              autocomplete="channel-topic"
              :placeholder="$t('channel.editor.channelTopicPlaceholder')" />
          </div>

          <div class="form-check" v-if="channel.type !== 'group'">
            <input
              class="input-chk"
              type="checkbox"
              id="channel-type"
              v-model="channel.type"
              :disabled="!channel.canUpdate"
              true-value="private"
              false-value="public" />
            <label for="channel-type">
              {{ $t('channel.editor.channelPrivateLabel') }}
            </label>
          </div>

          <div class="form-check">
            <input
              class="input-chk"
              type="checkbox"
              id="channel-membership-policy"
              v-model="channel.membershipPolicy"
              :disabled="channel.type !== 'public' || !channel.canChangeMembershipPolicy"
              true-value="featured"
              false-value="">
            <label for="channel-membership-policy">
              {{ $t('channel.editor.channelMembershipPolicyFeatured') }}
            </label>
          </div>

          <div class="selected-members">
            <label v-if="members.length > 0">{{ $t('channel.editor.selectedMembersLabel') }}</label>
            <ul>
              <li v-for="(u) in members" :key="u.userID">
                <user-avatar :userID="u.userID" />
                {{ label(u) }}
                <button class="btn-i" @click.prevent="removeMember(u)"><i class="icon-x"></i></button>
              </li>
            </ul>
          </div>

          <div v-if="!channel.channelID">
            <label class="label-block">{{ $t('channel.editor.addMembersLabel') }}</label>
            <vue-simple-suggest
              v-model="selectedMember"
              :list="nonMembers"
              :placeholder="$t('channel.editor.addMembersPlaceholder')"
              :filter-by-query="true"
              value-attribute="ID"
              display-attribute="name"
              @select="onMemberSelect"
              class="select-members"
              :destyled="true"
            />
          </div>

          <div class="actions">
            <button class="btn btn-green" v-if="channel.channelID && channel.canUpdate">{{ $t('channel.editor.update') }}</button>
            <button class="btn btn-green" v-if="!channel.channelID">{{ $t('channel.editor.create') }}</button>
            <button class="btn" @click.prevent="$router.back()">{{ $t('channel.editor.close') }}</button>
          </div>
        </form>

        <div v-if="channel.channelID">
          <confirmation-row
            class="toggle-state"
            v-if="!channel.archivedAt && channel.canArchive"
            @confirmed="updateChannelState('archive')"
            cta="Archive">
            {{ $t('notification.channel.archiveChannel') }}
          </confirmation-row>

          <confirmation-row
            class="toggle-state"
            v-if="channel.archivedAt && channel.canArchive"
            @confirmed="updateChannelState('unarchive')"
            cta="Unarchive" ctaClass="info">
            {{ $t('notification.channel.unArchive') }}
          </confirmation-row>

          <confirmation-row
            class="toggle-state"
            v-if="!channel.deletedAt && channel.canDelete"
            @confirmed="updateChannelState('delete')"
            cta="Delete">
            {{ $t('notification.channel.delete') }}
          </confirmation-row>

          <confirmation-row
            class="toggle-state"
            v-if="channel.deletedAt && channel.canDelete"
            @confirmed="updateChannelState('undelete')"
            cta="Undelete" ctaClass="info">
            {{ $t('notification.channel.unDelete') }}
          </confirmation-row>
        </div>
      </main>
  </section>
</template>
<script>
import { Channel } from 'corteza-webapp-messaging/src/types'
import { mapGetters, mapMutations } from 'vuex'
import ConfirmationRow from 'corteza-webapp-messaging/src/components/Form/ConfirmationRow'
import SearchInput from 'corteza-webapp-messaging/src/components/SearchInput'
import VueSimpleSuggest from 'vue-simple-suggest/lib/vue-simple-suggest'
import 'vue-simple-suggest/dist/styles.css'
import Avatar from 'corteza-webapp-messaging/src/components/Avatar'

const action = {
  add: 'add',
  remove: 'remove',
}

export default {
  name: 'channel-editor',

  components: {
    VueSimpleSuggest,
    SearchInput,
    ConfirmationRow,
    'user-avatar': Avatar,
  },

  props: ['channelID', 'type'],

  data () {
    return {
      channel: new Channel(),
      error: null,

      actionsUser: {},

      selectedMember: null,
      autoCompleteStyle: {
        vueSimpleSuggest: 'position-relative',
        inputWrapper: '',
        defaultInput: 'form-control',
        suggestions: 'position-absolute list-group z-1000',
        suggestItem: 'list-group-item',
      },
    }
  },

  computed: {
    ...mapGetters({
      users: 'users/list',
    }),

    nonMembers () {
      return this.users.filter(u => !this.channel.isMember(u.userID) && u.userID !== this.$auth.user.userID)
    },

    members () {
      return this.users.filter(u => this.channel.isMember(u.userID))
    },
  },

  watch: {
    'channelID' (newID) {
      this.load(newID)
    },

    'type' (newType) {
      if (!this.channel.channelID) this.load()
    },
  },

  mounted () {
    this.load(this.channelID)
  },

  methods: {
    ...mapMutations({
      removeChannelFromList: 'channels/removeFromList',
    }),

    removeMember (u) {
      if (!this.actionsUser[u.userID]) {
        this.$set(this.actionsUser, u.userID, [])
      }

      this.actionsUser[u.userID].push(action.remove)
      this.channel.removeMember(u)
    },

    load (channelID) {
      if (channelID) {
        this.$MessagingAPI.channelRead({ channelID }).then((ch) => {
          this.channel = new Channel(ch)
        }).catch((error) => {
          console.error('Failed to load channel info', { error })
        }).finally(() => {
          // this.disabled = false
        })
      } else {
        this.channel = new Channel()
        if (this.type) {
          this.channel.type = this.type
        }
      }
    },

    // moving channels between deleted, undeleted, archived, unarchived states
    updateChannelState (state) {
      this.$MessagingAPI.channelState({ channelID: this.channel.channelID, state }).then((ch) => {
        this.channel = new Channel(ch)
      }).catch(({ message }) => {
        this.error = message
      })
    },

    onSubmit () {
      const channelID = this.channel.channelID
      if (channelID) {
        console.debug('Updating channel', this.channel)
        // Update member list; if the list was altered
        const actions = Object.entries(this.actionsUser)
        if (actions.length) {
          for (const [ userID ] of actions) {
            // @note When we allow memer adding in this interface; this should be updated
            this.$MessagingAPI.channelPart({ channelID, userID })
          }
        }
        // Update channel
        this.$MessagingAPI.channelUpdate({ ...this.channel, channelID: channelID }).then((ch) => {
          console.debug('Channel updated', ch)
          this.$router.push({ name: 'channel', params: { channelID: this.channelID } })
        }).catch((error) => {
          this.error = error.message
        })
      } else {
        console.debug('Creating channel', this.channel)
        this.$MessagingAPI.channelCreate(this.channel).then((ch) => {
          console.debug('Channel created', ch)
          this.$router.push({ name: 'channel', params: { channelID: ch.channelID } })
        }).catch(({ error }) => {
          this.error = error
        })
      }
    },

    onMemberSelect (user) {
      if (!user) return
      this.selectedMember = ''
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

section.toggle-state {
  border-top: 1px solid $secondary;
  font-size: 1.5em;
  padding: 20px 10px 30px 10px;
  margin: 20px;
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

ul {
  padding: 0;
  margin-top: 5px;
  li {
    list-style: none;
    display: inline-block;
    margin-right: 5px;
    vertical-align: bottom;
  }
}

.btn-i {
  padding: 0 10px 0 0;
  margin-top: -5px;
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
    max-height: 100px;
    .suggest-item {
      cursor: pointer;
      padding: 5px 0 0;
        &:hover {
          color: $primary;
        }
    }
  }
}

</style>
