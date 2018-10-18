<template>
  <section class="modal">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <a @click="$router.back()" class="close"><i class="icon-close"></i></a>
          <h1 v-if="ch.type === 'group'">Group editor</h1>
          <h1 v-else>Channel editor</h1>
        </div>
        <form class="editor" @submit.prevent="submit">
          <div v-if="ch.type !== 'group'">
            <label>Channel name</label>
            <input
              name="name"
              v-model.trim="ch.name"
              required
              autocomplete="channel-name"
              placeholder="Make it short, make it sweet">
          </div>

          <div v-if="ch.type !== 'group'">
            <label>Topic</label>
            <input
              name="topic"
              v-model.trim="ch.topic"
              autocomplete="channel-topic"
              placeholder="Things we talk about">
          </div>
          <div v-if="ch.type !== 'group'">
            <label>
              <input type="checkbox" v-model="ch.type" true-value="private" false-value="public">
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

          <div class="modal-footer">
            <button class="btn btn-success" v-if="ch.ID">Update</button>
            <button class="btn btn-success" v-else>Create</button>
            <button class="btn btn-danger"  v-if="ch.ID" @click.prevent="deleteChannel">Delete</button>
            <button
              class="btn btn-info"
              @click.prevent="$router.back()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
<script>
import { Channel } from '@/types'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'channel-editor',
  props: ['channelID', 'type'],

  data () {
    let ch = new Channel()
    if (this.type) {
      ch.type = this.type
    }

    return {
      ch: ch,
    }
  },

  computed: {
    ...mapGetters({
      users: 'users/list',
    }),
  },


  mounted () {
    // @todo is this a group or pub/prv?

    if (this.channelID !== undefined) {
      this.$rest.getChannel(this.channelID).then((ch) => {
        this.ch = ch

        this.$rest.getMembers(this.channelID).then((members) => {
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
    }
  },

  methods: {
    ...mapActions({
      updateChannelList: 'channels/updateList',
      removeChannelFromList: 'channels/removeFromList',
    }),

    submit () {
      if (this.ch.ID) {
        console.debug('Updating channel', this.ch)
        this.$rest.updateChannel(this.ch).then((ch) => {
          console.debug('Channel updated', ch)
          this.$router.push({ name: 'channel', params: { channelID: this.channelID } })
        }).catch((error) => {
          console.error('Failed to store channel update', { error })
        })
      } else {
        console.debug('Creating channel', this.ch)
        this.$rest.createChannel(this.ch).then((ch) => {
          console.debug('Channel created', ch)

          // Add each selected member to the channel we've just created...
          this.ch.members.forEach((memberID) => {
            this.$rest.addMember(ch.ID, memberID)
          })

          this.$router.push({ name: 'channel', params: { channelID: ch.ID } })
        }).catch((error) => {
          console.error('Failed to store channel update', { error })
        })
      }
    },

    deleteChannel () {
      if (this.ch) {
        if (!confirm('Are you sure to delete this channel?')) {
          return
        }

        console.debug('Deleting channel', this.ch)
        this.$rest.deleteChannel(this.ch).then(() => {
          console.debug('Channel delete')
          this.removeChannelFromList(this.ch)
          this.$router.push({ name: 'root' })
        })
      }
    },
  },
}
</script>
<style scoped lang="scss">
  @import '@/assets/sass/_0.commons.scss';
  @import '@/assets/sass/modals.scss';
  @import '@/assets/sass/inputs.scss';
</style>
