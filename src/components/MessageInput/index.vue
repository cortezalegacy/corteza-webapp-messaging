<template>

  <observer-footer
      v-if="readonly"
      :channel="channel" />

  <div v-else class="container"
       :class="{editing:!!message, inThread:!!replyTo}">

      <div class="group">

          <text-input
              :key="textInputKey"
              @editLastMessage="$emit('editLastMessage', $event)"
              @cancel="$emit('cancel', $event)"
              @submit="onSubmit"
              @change="onChange"
              @focus="onFocus"
              v-model="value"
              :preset="editableString"
              :focus="keepFocusOnSubmit || (focus && uiFocusMessageInput())"
              :submitOnEnter="!uiEnableSubmitButton()"
              :channels="channelSuggestions"
              :users="userSuggestions"
              :channel="channel"
              :user="$auth.user"
              class="text-input "
              :class="{'no-files': !showFileUpload}" />

          <button
              v-if="showFileUpload"
              class="upload-button input-button"
              @click="onPromptFilePicker">
              <span>+</span>
          </button>

          <button
              v-if="uiEnableSubmitButton()"
              class="input-button send-button"
              @click="onSubmitBtnClick">
              <span class="icon-hsend"></span>
          </button>

    <!--
          <i class="emoji-picker-button icon-smile"
             title="Insert emoji"
             @click="onEmojiPickerClick"
          ></i> -->

      </div>
      <div class="activity">
        <activity v-if="!replyTo && !message" :users="channelActivity(channelID, 'typing')" :activity="$t('message.typing')"></activity>
        <button class="btn float-right"
                v-show="hasUnreads({ channelID, threadID: replyTo ? replyTo.messageID : '0' })"
                @click.prevent="$emit('markAsRead')">{{ $t('message.markAsRead') }}</button>
      </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { throttle } from 'lodash'
import TextInput from './TextInput'
import ObserverFooter from '@/components/Channel/ObserverFooter'
import Activity from './Activity'
import { EmojiPicker } from 'emoji-mart-vue'
import { enrichMentions } from '@/lib/mentions'

const kinds = {
  editing: 'editing',
  replying: 'replying',
  typing: 'typing',
}

export default {
  components: {
    TextInput,
    EmojiPicker,
    Activity,
    ObserverFooter,
  },

  props: {
    hideFileUpload: false,

    // Message we're editing, if any...
    message: Object,

    // Replying to a message, if any...
    replyTo: Object,

    // Channel we're posting to
    channel: Object,

    focus: { type: Boolean, default: true },
    readonly: { type: Boolean, default: false },
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

  computed: {
    ...mapGetters({
      users: 'users/list',
      channels: 'channels/list',
      channelActivity: 'users/channelActivity',
      messageActivity: 'users/messageActivity',
      statuses: 'users/statuses',
      hasUnreads: 'unread/has',
    }),

    channelID () {
      // Returns channelID from one of the provided params
      return (this.channel || {}).channelID || (this.message || {}).channelID || (this.replyTo || {}).channelID
    },

    channelSuggestions () {
      return this.channels.map(c => {
        const value = c.name || c.channelID || ''
        return { type: 'Channel', id: c.channelID, value, key: c.fuzzyKey(), members: c.members, name: c.name, opts: { membershipFlag: c.membershipFlag, type: c.type } }
      })
    },

    onlineStatuses () {
      return new Set(this.statuses.filter(s => s.present === 'online').map(s => s.userID))
    },

    userSuggestions () {
      return this.users.map(u => {
        const value = u.name || u.userID || ''
        return { type: 'User', id: u.userID, value, key: u.fuzzyKey(), online: this.onlineStatuses.has(u.userID), name: u.name }
      })
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

  watch: {
    channel () {
      this.clearInputText()
    },
  },

  beforeMount () {
    if (!this.channelID) {
      console.error('Could not mount message input without at least one of channel/message/replyTo props')
      return false
    }

    if (this.message) {
      // When editing a message, make sure we prefill value
      this.value = this.message.message
    }
  },

  methods: {
    ...mapActions({
      // @todo unread setChannelUnreadCount: 'unread/setChannel',
    }),

    clearInputText () {
      this.value = ''
      this.textInputKey++
    },

    onPromptFilePicker () {
      this.$emit('promptFilePicker', {})
    },

    // Override original submit event and extend event
    // data with submitMeta data.
    onSubmit ($event) {
      // Make a copy and reset component's version of a value to prevent dups
      const value = $event.value.trim()
      this.value = ''

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
        this.$MessagingAPI.messageEdit({ channelID: this.message.channelID, messageID: this.message.messageID, message: value }).then(stdResponse)
      } else if (this.replyTo) {
        // Sending reply
        this.$MessagingAPI.messageReplyCreate({ channelID: this.replyTo.channelID, messageID: this.replyTo.messageID, message: value }).then(stdResponse)
      } else if (this.channel) {
        this.keepFocusOnSubmit = true

        // Sending message
        if (this.$commands.test(value)) {
          this.$commands.exec(this, value, { channel: this.channel })
          this.clearInputText()
          return
        }

        this.$MessagingAPI.messageCreate({ channelID: this.channel.channelID, message: value }).then(stdResponse)
        this.$store.commit('unread/unset', this.channel)
      }
    },

    onSubmitBtnClick ($event) {
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
    onChange: throttle(function (value) {
      // @todo emoji closing on focus interaction should be handled by core.js
      this.$bus.$emit('ui.closeEmojiPicker')

      let params
      if (value.text.length === 0) {
        return
      } else if (this.message !== undefined) {
        params = { channelID: this.message.channelID, messageID: this.message.messageID, kind: kinds.editing }
      } else if (this.replyTo !== undefined) {
        params = { channelID: this.replyTo.channelID, messageID: this.replyTo.messageID, kind: kinds.replying }
      } else {
        params = { channelID: this.channelID, kind: kinds.typing }
      }

      if (params) {
        this.$MessagingAPI.activitySend(params)
      }
    }, 2000),

    onFocus () {
      // @todo emoji closing on focus interaction should be handled by core.js
      this.$bus.$emit('ui.closeEmojiPicker')
    },
  },
}
</script>

<style lang="scss" scoped>
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/btns.scss';

$inputWidth: 50px;
$mobileInputWidth: 35px;

.container {
  padding: 4px 15px 0;
  .activity {
    min-height: 25px;
    width: 100%;
    display: inline-block;
    border: 1px solid transparent;
  }

  .group {
    float: left;
    width: 100%;
    position: relative;
    margin-bottom: 2px;
    border: 1px solid $appgrey;
    .text-input {
      width: calc(100% - #{$inputWidth});
      float:right;
      &:focus-within {
        outline: none;
        border-color: $appgreen;

        ~ .upload-button {
         background-color:rgba($appgreen,0.1);
         border-color:$appgreen;
         color:$appgreen;
        }
        ~ .send-button{
          span{
            color: $appgreen;
          }
        }
      }
    }
    .input-button {
      width: $inputWidth;
      position: absolute;
      height: 100%;
      color: $appgrey;
      cursor: pointer;
      font-size:28px;
      span{
        margin-top: -5px;
        display: block;
      }
      &:focus{
        outline: none;
      }
    }
    .input-button,
    .text-input
    {
      border: 1px solid transparent;
      background-color:transparent;
    }
  }

  &.editing {
    display: inline-block;
    width: 100%;
    padding: 0 10px 0 0;
    overflow: visible;
    .text-input {
      width: 100%;
    }
    .group
    {
      background-color:white;
    }
    .activity {
      border: none;
      display: none;
    }

  }
}
/deep/ .ql-editor {
  max-height: 30vh;
}

@media (max-width: $wideminwidth) {
  .container {
    padding: 0;
    .group {
      margin-bottom: 0;
      border: none;
      border-top: 1px solid $appgrey;
      border-radius: 0;
      .text-input {
        width: calc(100% - #{$mobileInputWidth});
        border: none;
        border-top: 1px solid transparent;
        padding-right: 25px;
      }
      .input-button {
        width: $mobileInputWidth;
        &.send-button{
          font-size: 20px;
          right: 0;
        }
      }
    }
    .activity{
      display: none;
    }
    &.editing{
      .text-input{
        width: 100%;
      }
    }
  }
}
</style>
