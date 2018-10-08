<template>
  <section class="channel">
    <h1>Channel editor</h1>
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

      <hr />
      <div class="right">
        <button v-if="channel">Update</button>
        <button v-else>Create</button>
        <button v-if="channel" @click.prevent="deleteChannel">Delete</button>
      </div>
    </form>
  </section>
</template>
<script>
import { mapActions } from 'vuex'
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
    console.log(this.channel)
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
    ...mapActions({
      updateList: 'channels/updateList',
    }),

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
<style scoped>
section {
  padding-left: 30px;
}

label {
  display:block
}

.right {
  text-align: right
}
</style>
