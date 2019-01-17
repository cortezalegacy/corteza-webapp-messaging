<template>
  <section>
      <header class="header">
        <label class="closer"
               @click.prevent="$router.back()"
               aria-label="Close"><i class="icon-close"></i></label>
          <span class="title" v-if="channel.type === 'group' && channel.ID">Edit group</span>
          <span class="title" v-else-if="channel.type === 'group'">Create new group</span>
          <span class="title" v-else-if="channel.ID">Channel editor</span>
          <span class="title" v-else>Create new channel</span>
      </header>
      <main class="container">
        <form class="editor big-form" @submit.prevent="onSubmit" v-if="!channel.ID || channel.type !== 'group'">
          <div v-if="error" class="error">
            {{error}}
          </div>
<!--
          <div class="notification info no-margin">
              <p>Notifications ready to use ! Check assets/sass/README.MD for more info</p>
              <span class="close"></span>
          </div>
-->
          <div v-if="channel.type !== 'group'" class="input-wrap">
            <label class="label-block">Channel name *</label>
            <input
              class="input-txt input-block name"
              name="name"
              v-model.trim="channel.name"
              required
              :disabled="!channel.canUpdate"
              autocomplete="channel-name"
              placeholder="Make it short, make it sweet">
          </div>

          <div v-if="channel.type !== 'group'" class="input-wrap">
            <label class="label-block">Topic</label>
            <input
              class="input-txt input-block"
              name="topic"
              v-model.trim="channel.topic"
              :disabled="!channel.canUpdate"
              autocomplete="channel-topic"
              placeholder="Things we talk about">
          </div>

          <div class="form-check" v-if="channel.type !== 'group'">
            <input
              class="input-chk"
              type="checkbox"
              id="channel-type"
              v-model="channel.type"
              :disabled="!channel.canUpdate"
              true-value="private"
              false-value="public">
            <label for="channel-type">
                Make this channel private
            </label>
          </div>

          <div v-if="!channel.ID">
            <label class="label-block">Members</label>
            <vue-simple-suggest
              v-model="selectedMember"
              :list="nonMembers"
              placeholder="Find users to add as members"
              :filter-by-query="true"
              value-attribute="ID"
              display-attribute="name"
              @select="onMemberSelect"
              class="select-members"
              :destyled="true"
              />

            <ul>
              <li v-for="(u) in members" :key="u.ID">
                {{ label(u) }}
                <button @click.prevent="channel.removeMember(u)">remove</button>
              </li>
            </ul>
          </div>

          <div class="actions">
            <button class="btn btn-green" v-if="channel.ID && channel.canUpdate">Update</button>
            <button class="btn btn-green" v-if="!channel.ID">Create</button>
            <button class="btn" @click.prevent="$router.back()">Close</button>
          </div>
        </form>

        <div v-if="channel.ID">
          <confirmation-row
            class="toggle-state"
            v-if="!channel.archivedAt && channel.canArchive"
            @confirmed="updateChannelState('archive')"
            cta="Archive">
            Archive this channel?
          </confirmation-row>

          <confirmation-row
            class="toggle-state"
            v-if="channel.archivedAt && channel.canArchive"
            @confirmed="updateChannelState('unarchive')"
            cta="Unarchive" ctaClass="info">
            Unarchive this channel?
          </confirmation-row>

          <confirmation-row
            class="toggle-state"
            v-if="!channel.deletedAt && channel.canDelete"
            @confirmed="updateChannelState('delete')"
            cta="Delete">
            Delete this channel?
          </confirmation-row>

          <confirmation-row
            class="toggle-state"
            v-if="channel.deletedAt && channel.canDelete"
            @confirmed="updateChannelState('undelete')"
            cta="Undelete" ctaClass="info">
            Undelete this channel?
          </confirmation-row>
        </div>
      </main>
  </section>
</template>
<script>
import { Channel } from '@/types'
import { mapGetters, mapActions } from 'vuex'
import ConfirmationRow from '@/components/Form/ConfirmationRow'
import SearchInput from '@/components/SearchInput'
import VueSimpleSuggest from 'vue-simple-suggest/lib/vue-simple-suggest'
import 'vue-simple-suggest/dist/styles.css'

export default {
  name: 'channel-editor',
  props: ['channelID', 'type'],

  data () {
    return {
      channel: new Channel(),
      error: null,

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
      currentUser: 'auth/user',
    }),

    nonMembers () {
      return this.users.filter(u => !this.channel.isMember(u.ID) && u.ID !== this.currentUser.ID)
    },

    members () {
      return this.users.filter(u => this.channel.isMember(u.ID))
    },
  },

  watch: {
    'channelID' (newID) {
      this.load(newID)
    },

    'type' (newType) {
      if (!this.channel.ID) this.channel.type = newType
    },
  },

  mounted () {
    this.load(this.channelID)
  },

  methods: {
    ...mapActions({
      removeChannelFromList: 'channels/removeFromList',
    }),

    load (channelID) {
      if (channelID) {
        this.$rest.getChannel(channelID).then((ch) => {
          this.channel = ch

          this.$rest.getMembers(channelID).then((members) => {
            console.debug('Chanel member info loaded into editor', members)
            this.channel.members = members.map((m) => {
              return m.user.ID
            })
          })
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
      this.$rest.updateChannelState(this.channel.ID, state).then((ch) => {
        this.channel = ch
      }).catch(({ message }) => {
        this.error = message
      })
    },

    onSubmit () {
      if (this.channel.ID) {
        console.debug('Updating channel', this.channel)
        this.$rest.updateChannel(this.channel).then((ch) => {
          console.debug('Channel updated', ch)
          this.$router.push({ name: 'channel', params: { channelID: this.channelID } })
        }).catch((error) => {
          this.error = error.message
        })
      } else {
        console.debug('Creating channel', this.channel)
        this.$rest.createChannel(this.channel).then((ch) => {
          console.debug('Channel created', ch)
          this.$router.push({ name: 'channel', params: { channelID: ch.ID } })
        }).catch(({ error }) => {
          this.error = error
        })
      }
    },

    onMemberSelect (user) {
      this.selectedMember = ''
      this.channel.members.push(user.ID)
    },
  },

  components: {
    VueSimpleSuggest,
    SearchInput,
    ConfirmationRow,
  },
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/inputs.scss';
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/headers.scss';
@import '@/assets/sass/btns.scss';
@import '@/assets/sass/notifications.scss';

.header {
  .title {
    padding-top: 15px;
  }
}

div.error {
  color: $appred;
}

form, main > section {
  padding: 10px;
  margin: 20px;
}

form {
  .actions {
    text-align: right;
  }
}

section.toggle-state {
  border-top: 1px solid $appgrey;
  font-size: 1.5em;
  padding: 20px 10px 30px 10px;
  margin: 20px;
}

.default-input{
  font-size: 16px;
}

.closer {
  position: relative;
  color: $appgrey;
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

</style>

<style lang="scss">
  .select-members{
    .input-wrapper{
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
  }
</style>
