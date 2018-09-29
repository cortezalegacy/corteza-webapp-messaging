<template>
  <div class="channel-input crust_iam_footer">
    <button class="upload-button" @click="promptFilePicker">
      +
    </button>
    <textarea-autosize :min-height="18" :max-height="300"
      class="message-input"
      v-on:keyup.native.exact.enter="send"
      :disabled="disabled"
      createImageThumbnails="false"
      rows="1"
      v-model.trim="msg"
      placeholder="Write a message..."></textarea-autosize>
  </div>
</template>

<script>
export default {
  name: 'channel-input',

  props: [ 'channelID', 'userId' ],

  data () {
    return {
      msg: '',
      disabled: true
    }
  },

  mounted () {
    this.disabled = false
  },

  methods: {
    promptFilePicker () {
      this.$emit('promptFilePicker', {})
    },

    send () {
      if (this.msg.length === 0) {
        return
      }

      this.disabled = true

      if (this.channelID) {
        console.debug(
          'Sending message to channel',
          {msg: this.msg, channelID: this.channelID})

        this.$ws.sendMessage(this.channelID, this.msg).then(() => {
          this.msg = ''
          this.disabled = false
        })
      } else if (this.userId) {
        console.debug(
          'Sending direct message to user',
          {msg: this.msg, userId: this.userId})

        this.$rest.sendDirectMessage(this.userId, this.msg).then((newMessage) => {
          this.$emit('directMessageSent', newMessage)
        }).catch((error) => {
          console.error('Failed to send direct message', {error})
        }).finally(() => {
          this.disabled = false
        })
      }
    }
  }
}
</script>

<style scoped>
.upload-button{
  background: white;
  height: 43px;
  width: 43px;
  position: absolute;
  color: #90A3B1;
  border: 1px solid #90A3B1;
  border-radius: 5px;
  font-size: 1.5rem;
  cursor: pointer;
}
.upload-button:focus{
  outline: none;
}
</style>
