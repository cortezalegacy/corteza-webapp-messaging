<template>
  <div class="channel-input">
    <textarea-autosize :min-height="43" :max-height="180"
      class="message-input"
      v-on:keyup.native.exact.enter="send"
      :disabled="disabled"
      createImageThumbnails="false"
      rows="1"
      v-model.trim="msg"
      placeholder="Write a message..."></textarea-autosize>
    <!-- this order is reversed in css, but it enables me to use ~ to affect the button aspect on textarea input -->
    <button class="upload-button" @click="promptFilePicker">+</button>
  </div>
</template>

<script>
export default {
  name: 'channel-input',

  props: [ 'channelID', 'userId' ],

  data () {
    return {
      msg: '',
      disabled: true,
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
          { msg: this.msg, channelID: this.channelID })

        this.$ws.sendMessage(this.channelID, this.msg).then(() => {
          this.msg = ''
          this.disabled = false
        })
      } else if (this.userId) {
        console.debug(
          'Sending direct message to user',
          { msg: this.msg, userId: this.userId })

        this.$rest.sendDirectMessage(this.userId, this.msg).then((newMessage) => {
          this.$emit('directMessageSent', newMessage)
        }).catch((error) => {
          console.error('Failed to send direct message', { error })
        }).finally(() => {
          this.disabled = false
        })
      }
    },
  },
}
</script>

<style lang="scss" scoped>
  @import '@/assets/sass/_0.commons.scss';
  // This component probably won't be used elsewhere,
  // should it be the cas easy to externalize
  .channel-input
  {
    min-height:50px;
    width:100%;
    border:solid 5px $appwhite;
    background-color:$appwhite;
    box-shadow: 0.2rem 0 0.2rem 0 rgba($defaulttextcolor, 0.1);
  }

  .upload-button, .message-input
  {
    border: 1px solid transparent;
    background-color:transparent;
  }

  .message-input
  {
    font-family: $crustregular;
    margin-left:50px;
    width:calc(100% - 50px);
    border-radius: 0 5px 5px 0;
    border-left:0;
    float:right;
    font-size:14px;
    padding:14px 5px;
    line-height:15px;
  }

  .upload-button {
    position: absolute;
    height: calc(100%);
    width: 50px;
    color: $appgrey;
    border-radius: 5px 0 0 5px;
    font-size: 1.5rem;
    cursor: pointer;
    text-align: center;
    font-size:32px;
    line-height: 100%;
    float:left;
  }

  .upload-button:focus {
    outline: none;
  }

  .message-input:focus {
    outline:none;
    border-color:$appgreen;
    ~ .upload-button
    {
      background-color:rgba($appgreen,0.1);
      border-color:$appgreen;
      color:$appgreen;
    }
  }
  // another background in wide, and no shadow
  @media (min-width: $wideminwidth)
  {
    .channel-input
    {
      border:solid 5px $mainbgcolor;
      background-color:$mainbgcolor;
      box-shadow: none;
    }
  }

</style>
