<template>
  <div class="channel-input"
       :class="{editing:!!message, inThread:!!replyTo}">

    <div class="wrap">

      <text-input
        :key="textInputKey"
        @editLastMessage="$emit('editLastMessage', $event)"
        @cancel="$emit('cancel', $event)"
        @submit="onSubmit"
        @change="onChange"
        v-model="value"
        :preset="editableString"
        :focus="keepFocusOnSubmit || (focus && uiFocusMessageInput())"
        :submitOnEnter="!uiEnableSubmitButton()"
        :channels="channelSuggestions"
        :users="userSuggestions"
        class="message-input"
        :class="{'no-files': !showFileUpload}" />

      <button
        v-if="showFileUpload"
        class="upload-button input-button"
        @click="onPromptFilePicker">
        <span>+</span>
      </button>
      <button
        v-if="uiEnableSubmitButton()"
        class="send-button input-button"
        @click="onSubmitBtnClick">
        <span class="icon-hsend"></span>
      </button>

<!--
      <i class="emoji-picker-button icon-smile"
         title="Insert emoji"
         @click="onEmojiPickerClick"
      ></i> -->
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import _ from 'lodash'
import TextInput from './TextInput'
import { EmojiPicker } from 'emoji-mart-vue'
import { enrichMentions } from '@/lib/mentions'

export default {
  props: {
    hideFileUpload: false,

    // Message we're editing, if any...
    message: Object,

    // Replying to a message, if any...
    replyTo: Object,

    // Channel we're posting to
    channel: Object,

    focus: { type: Boolean, default: true },
  },

  data () {
    return {
      inputBoxValue: '',
      cursorIndex: -1,
      value: '',

      // This handles input component redrawing/remounting
      // we need to do it to get because setting input.value to ''
      // does not work as expected (value does not change)
      textInputKey: 0,

      keepFocusOnSubmit: false,
    }
  },

  watch: {
    channel () {
      this.clearInputText()
    },
  },

  computed: {
    ...mapGetters({
      users: 'users/list',
      channels: 'channels/list',
    }),

    channelID () {
      // Returns channelID from one of the provided params
      return (this.channel || {}).ID || (this.message || {}).channelID || (this.replyTo || {}).channelID
    },

    channelSuggestions () {
      return this.channels.map(c => { return { id: c.ID, value: c.name || c.ID || '' } })
    },

    userSuggestions () {
      return this.users.map(u => { return { id: u.ID, value: u.name || u.ID || '' } })
    },

    showFileUpload () {
      // Hide file upload when editing
      return !this.hideFileUpload || !this.message
    },

    editableString () {
      if (this.message) {
        return enrichMentions(this.message.message)
      }

      return ''
    },
  },

  beforeMount () {
    if (!this.channelID) {
      console.error('Could not mount message input without at least one of channel/message/replyTo props')
      return false
    }
  },

  methods: {
    ...mapActions({
      setChannelUnreadCount: 'unread/setChannel',
    }),

    clearInputText () {
      this.textInputKey++
    },

    onPromptFilePicker () {
      this.$emit('promptFilePicker', {})
    },

    // Override original submit event and extend event
    // data with submitMeta data.
    onSubmit (ev) {
      const value = ev.value.trim()

      const stdResponse = () => {
        // Trigger remounting
        this.clearInputText()

        // Tell parent we're done with editing.
        this.$emit('cancel', {})
      }

      if (this.message && value.length === 0) {
        this.$emit('deleteMessage')
      } else if (value.length === 0) {
        // nothing to do here...
        return false
      } else if (this.message) {
        // Doing update
        this.$rest.updateMessage(this.message.channelID, this.message.ID, value).then(stdResponse)
      } else if (this.replyTo) {
        // Sending reply
        this.$rest.sendReply(this.replyTo.channelID, this.replyTo.ID, value).then(stdResponse)
      } else if (this.channel) {
        this.keepFocusOnSubmit = true

        // Sending message
        if (this.$commands.test(value)) {
          this.$commands.exec(this, value, { channel: this.channel })
          this.clearInputText()
          return
        }

        this.$rest.sendMessage(this.channel.ID, value).then(stdResponse)
        this.setChannelUnreadCount({ ID: this.channel.ID, count: 0, lastMessageID: 0 })
      }
    },

    onSubmitBtnClick (value) {
      this.onSubmit({ value: this.value })
      this.clearInputText()
    },

    // onEmojiPickerClick () {
    //   this.$bus.$emit('ui.openEmojiPicker', {
    //     callback: ({ colons }) => {
    //       // Got called back from the emoji picker, now send the reaction to this message...
    //       // this.$bus.$emit('message.reaction', { message: this.message, reaction: colons })
    //       console.log('FOO')
    //     },
    //   })
    // },

    // Update channel activity once in a while while typing
    onChange: _.throttle(function (value) {
      console.log(value)
      if (value.length > 1) {
        this.$ws.send({ channelActivity: { ID: this.channelID, kind: 'typing' } })
      }
    }, 2000),
  },

  components: {
    TextInput,
    EmojiPicker,
  },
}
</script>

<style lang="scss" scoped>
// @todo remove div.wrap, merge it with base tag
// @todo move all styling and basic positioning inside <text-input>

  @import '@/assets/sass/_0.commons.scss';
  // This component probably won't be used elsewhere,
  // should it be the case easy to externalize
  $inputheight : 30px;
  $inputwidth : 30px;
  .channel-input
  {
    min-height:$inputheight;
    width:100%;
    background-color:$appwhite;
    box-shadow: 2px 0 2px 0 rgba($defaulttextcolor, 0.1);
    .wrap
    {
      float:left;
      width:100%;
      position:relative;
      max-width:100%;
    }
    &.editing
    {
      padding: 10px 0 10px 10px;
      .message-input{
        width: 100%;
      }
    }
  }

  .input-button, .message-input
  {
    border: 1px solid transparent;
    background-color:transparent;
  }

  .input-button span
  {
    display:inline-block;
    line-height: 1;
  }

  .message-input
  {
    font-family: $crustregular;
    margin-right:$inputwidth;
    width:calc(100% - #{$inputwidth * 2});
    border-radius: 0 5px 5px 0;
    border-left:0;
    float:right;
    font-size:15px;
    padding:0;
  }
  .channel-input.editing
  {
    margin-right:0;
    width:calc(100%);
    .wrap
    {
      display:table-cell;
      background-color:white;
    }
    .message-input
    {
      margin-left:30px;
    }
  }
  .message-input.no-files
  {
    margin-left: 0;
    width: 100%;
  }

  .input-button {
    position: absolute;
    height: calc(100%);
    width: $inputwidth;
    color: $appgrey;
    border-radius: 5px 0 0 5px;
    cursor: pointer;
    text-align: center;
    font-size:28px;
    margin-top: 0;
    line-height: 100%;
    float:left;
    z-index: 2;
    padding:0;
  }

  .send-button
  {
    right:0;
    font-size:24px;
    margin-top: 0px;
  }

  .input-button:focus {
    outline: none;
  }

  @media ( max-width: ($wideminwidth - 1px) )
  {
    .message-input ~
    {
      .send-button
      {
        display:inline-block;
      }
    }
    .channel-input.editing
    {
      margin-right:0;
      width:calc(100%);
      display:table-cell;
      box-shadow: 2px 0 2px 0 rgba($defaulttextcolor, 0.3);
      .wrap
      {
        padding-left:30px;

      }
    }
  }

  // another background in wide, and no shadow
  @media (min-width: $wideminwidth)
  {
    $wideinputheight : 50px;
    $wideinputwidth  : 50px;
    .channel-input
    {
      min-height:$wideinputheight;
      &.editing
      {
        border: none;
        padding-right: 10px;
        background: transparent;
        .message-input{
          width: 100%;
          &:focus-within{
            border-left: 1px solid $appgreen;
            border-radius: 5px;
          }
        }
        .send-button {
          margin-top: -2px;
        }
      }
    }

    .message-input:focus-within {
      outline:none;
      border-color:$appgreen;
      ~ .input-button
      {
        background-color:rgba($appgreen,0.1);
        border-color:$appgreen;
        color:$appgreen;
      }
    }

    .message-input
    {
      margin-left:$wideinputwidth;
      margin-right:0;
      width:calc(100% - #{$wideinputwidth});
    }
    .input-button
    {
      width: $wideinputwidth;
      font-size:30px;
    }
    .channel-input .wrap
    {
      border-radius: 5px;
      border: 1px solid $appgrey;
    }
    .channel-input
    {
      border:solid 15px $appwhite;
      border-top-width:0;
      border-bottom:none;
      padding-bottom:25px;
      border-color: $mainbgcolor;
      background-color:$mainbgcolor;
      box-shadow: none;
    }
  }

  /*.emoji-picker-button {*/
    /*position: absolute;*/
    /*right: 10px;*/
    /*font-size: 24px;*/
    /*top: 10px;*/
  /*}*/
</style>
