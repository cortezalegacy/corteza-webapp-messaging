<template>
  <section>
      <header class="header sub-header">
          <h2 v-if="ch.type === 'group' && ch.ID">Edit group</h2>
          <h2 v-else-if="ch.type === 'group'">Create new group</h2>
          <h2 v-else-if="ch.ID">Channel editor</h2>
          <h2 v-else>Create new channel</h2>
      </header>
      <main class="container">
        <form class="editor big-form" @submit.prevent="submit" v-if="!ch.ID || ch.type !== 'group'">
          <div v-if="error" class="error">
            {{error}}
          </div>

          <div v-if="ch.type !== 'group'" class="input-wrap">
            <label class="label-block">Channel name</label>
            <input
              class="input-txt input-block name"
              name="name"
              v-model.trim="ch.name"
              required
              autocomplete="channel-name"
              placeholder="Make it short, make it sweet">
          </div>

          <div v-if="ch.type !== 'group'" class="input-wrap">
            <label class="label-block">Topic</label>
            <input
              class="input-txt input-block"
              name="topic"
              v-model.trim="ch.topic"
              autocomplete="channel-topic"
              placeholder="Things we talk about">
          </div>

          <div class="form-check" v-if="ch.type !== 'group'">
            <input
              class="input-chk"
              type="checkbox"
              id="channel-type"
              v-model="ch.type"
              true-value="private"
              false-value="public">
            <label for="channel-type">
                Make this channel private
            </label>
          </div>

          <ul v-if="!ch.ID">
            <li v-for="u in users" :key="u.ID">
              <label>
                <input type="checkbox" v-model="ch.members" :value="u.ID"> {{u | userLabel }}
              </label>
            </li>
          </ul>

          <div class="actions">
            <button class="btn btn-green" v-if="ch.ID">Update</button>
            <button class="btn btn-green" v-else>Create</button>
            <button class="btn" @click.prevent="$router.back()">Close</button>
          </div>
        </form>

        <div v-if="ch.ID">
          <confirmation-row
            v-if="!ch.archivedAt"
            @confirmed="updateChannelState('archive')"
            cta="Archive">
            Archive this channel?
          </confirmation-row>

          <confirmation-row
            v-if="ch.archivedAt"
            @confirmed="updateChannelState('unarchive')"
            cta="Unarchive" ctaClass="info">
            Unarchive this channel?
          </confirmation-row>

          <confirmation-row
            v-if="!ch.deletedAt"
            @confirmed="updateChannelState('delete')"
            cta="Delete">
            Delete this channel?
          </confirmation-row>

          <confirmation-row
            v-if="ch.deletedAt"
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

export default {
  name: 'channel-editor',
  props: ['channelID', 'type'],

  data () {
    return {
      ch: new Channel(),
      error: null,
    }
  },

  computed: {
    ...mapGetters({
      users: 'users/list',
    }),
  },

  watch: {
    'channelID' (newID) {
      this.load(newID)
    },

    'type' (newType) {
      if (!this.ch.ID) this.ch.type = newType
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
          this.ch = ch

          this.$rest.getMembers(channelID).then((members) => {
            console.debug('Chanel member info loaded into editor', members)
            this.ch.members = members.map((m) => {
              return m.user.ID
            })
          })
        }).catch((error) => {
          console.error('Failed to load channel info', { error })
        }).finally(() => {
          // this.disabled = false
        })
      } else {
        this.ch = new Channel()
        if (this.type) {
          this.ch.type = this.type
        }
      }
    },

    submit () {
      if (this.ch.ID) {
        console.debug('Updating channel', this.ch)
        this.$rest.updateChannel(this.ch).then((ch) => {
          console.debug('Channel updated', ch)
          this.$router.push({ name: 'channel', params: { channelID: this.channelID } })
        }).catch((error) => {
          this.error = error.message
        })
      } else {
        console.debug('Creating channel', this.ch)
        this.$rest.createChannel(this.ch).then((ch) => {
          console.debug('Channel created', ch)
          this.$router.push({ name: 'channel', params: { channelID: ch.ID } })
        }).catch(({ error }) => {
          this.error = error
        })
      }
    },

    updateChannelState (state) {
      this.$rest.updateChannelState(this.ch.ID, state).then((ch) => {
        this.ch = ch
      }).catch(({ message }) => {
        this.error = message
      })
    },
  },

  components: {
    ConfirmationRow,
  },
}
</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/headers.scss';
@import '@/assets/sass/inputs.scss';
@import '@/assets/sass/btns.scss';

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

</style>
