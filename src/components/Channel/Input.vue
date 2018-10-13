<template>
  <div class="channel-input">
    <trigger-suggestions
      ref="triggerSuggestions"
      @selectSuggestion="selectSuggestion"
      :msg="getCurrentMsgChunk" />

    <div class="wrap">
      <input-rich-text
        @nodeChunkChanged="nodeChunkChanged"
        @navigateSuggestions="navigateSuggestions"
        @selectFocused="selectFocused"
        @msgUpdate="msgUpdate"
        @send="send"
        class="message-input"
        ref="richTextInput" />

      <button class="upload-button" @click="promptFilePicker">
        +
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import TriggerSuggestions from './TriggerSuggestions'
import commander from '@/plugins/commander'
import InputRichText from '@/components/Channel/InputRichText'


export default {
  name: 'channel-input',

  props: [ 'channelID', 'userId' ],

  data () {
    return {
      msg: '',
      disabled: true,
      cursorIndex: -1,
      curentChunk: {},
    }
  },

  mounted () {
    this.disabled = false
  },

  computed: {
    ...mapGetters({
      'findByUsername': 'users/findByUsername',
      'findByName': 'channels/findByName',
    }),

    // Gives msg chung where commands are possible
    getCurrentMsgChunk () {
      return this.curentChunk || {}
    },
  },

  methods: {
    nodeChunkChanged (e) {
      this.$set(this, 'curentChunk', e.chunk)
    },

    selectFocused () {
      this.$refs.triggerSuggestions.selectFocused()
    },

    navigateSuggestions (e) {
      switch (e.direction) {
        case 'up':
          this.$refs.triggerSuggestions.previous()
          break

        case 'down':
          this.$refs.triggerSuggestions.next()
          break
      }
    },

    msgUpdate (e) {
      this.msg = e.msg
    },

    selectSuggestion (e) {
      if (this.$refs.richTextInput.insertTriggeredNode(e)) this.$set(this, 'curentChunk', {})
    },

    promptFilePicker () {
      this.$emit('promptFilePicker', {})
    },

    send () {
      if (this.msg.length === 0) return
      if (this.msg[0] === '/') {
        if (this.execLocal(this.msg)) this.sendFinished()
        else this.sendCommand(this.msg)
      }
      else this.sendMsg(this.msg)
    },

    sendCommand (processedMsg) {
      const i = processedMsg.indexOf(' ')
      if (i < 1) {
        return
      }

      this.disabled = true
      const command = processedMsg.substr(1, i - 1)
      const input = processedMsg.substr(i + 1)

      console.debug('Executing a command', { command, input })

      this.$ws.exec(this.channelID, command, {}, input).then(() => {
        this.sendFinished()
      })
    },

    sendMsg (processedMsg) {
      this.disabled = true

      if (this.channelID) {
        console.debug(
          'Sending message to channel',
          { msg: processedMsg, channelID: this.channelID })

        this.$ws.sendMessage(this.channelID, processedMsg).then(() => {
          this.sendFinished()
        })
      } else if (this.userId) {
        console.debug(
          'Sending direct message to user',
          { msg: processedMsg, userId: this.userId })

        this.$rest.sendDirectMessage(this.userId, processedMsg).then((newMessage) => {
          this.$emit('directMessageSent', newMessage)
        }).catch((error) => {
          console.error('Failed to send direct message', { error })
        }).finally(() => {
          this.disabled = false
        })
      }
    },

    sendFinished () {
      this.msg = ''
      this.disabled = false
      this.$set(this, 'curentChunk', {})
    },
  },

  components: {
    TriggerSuggestions,
    InputRichText,
  },

  mixins: [
    commander,
  ],
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

    .wrap {
      float:left;
      width:100%;
      position:relative;
    }
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
    z-index: 2;
  }

  .upload-button:focus {
    outline: none;
  }

  .message-input:focus-within {
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
