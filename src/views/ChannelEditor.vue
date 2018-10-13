<template>
  <section class="modal">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <a @click="$router.back()" class="close"><i class="icon-close"></i></a>
          <h1>Channel editor</h1>
        </div>
        <form class="editor" @submit.prevent="submit">
          <div>
            <label>Channel name</label>
            <input
              name="name"
              v-model.trim="channel.name"
              required
              autocomplete="channel-name"
              placeholder="Make it short, make it sweet">
          </div>

          <div>
            <label>Topic</label>
            <input
              name="topic"
              v-model.trim="channel.topic"
              autocomplete="channel-topic"
              placeholder="Things we talk about">
          </div>

          <p>Type: <b>{{channel.type}}</b></p>
          <p>@todo Invite users</p>

          <div class="modal-footer">
            <!--
              @darh
              the v-if condition does not seem to work.
            -->
            <button class="btn btn-success" v-if="channel">Update</button>
            <button class="btn btn-success" v-else>Create</button>
            <button class="btn btn-danger"  v-if="channel" @click.prevent="deleteChannel">Delete</button>
            <router-link
              class="btn btn-info"
              :to="{ name: 'channel', params: { channelID: channelID } }">Cancel</router-link>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
<script>
import { Channel } from '@/types'

export default {
  name: 'channel-editor',
  props: ['channelID'],

  data () {
    return {
      channel: new Channel(),
    }
  },

  mounted () {
    if (this.channelID !== undefined) {
      this.$rest.getChannel(this.channelID).then((ch) => {
        console.debug('Channel info loaded into editor', ch)
        this.channel = ch
      }).catch((error) => {
        console.error('Failed to load channel info', { error })
      }).finally(() => {
        // this.disabled = false
      })
    }
  },

  methods: {
    submit () {
      if (this.channel.ID) {
        console.debug('Updating channel', this.channel)
        this.$rest.updateChannel(this.channel).then((ch) => {
          this.$router.push({ name: 'channel', params: { channelID: this.channelID } })
        }).catch((error) => {
          console.error('Failed to store channel update', { error })
        })
      } else {
        console.debug('Creating channel', this.channel)
        this.$rest.createChannel(this.channel).then((ch) => {
          console.debug('Channel created', ch)
          this.$router.push({ name: 'channel', params: { channelID: ch.ID } })
        }).catch((error) => {
          console.error('Failed to store channel update', { error })
        })
      }
    },

    deleteChannel () {
      if (this.channel) {
        if (!confirm('Are you sure to delete this channel?')) {
          return
        }

        console.debug('Deleting channel', this.channel.ID)

        this.$ws.deleteChannel(this.channel.ID)
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
