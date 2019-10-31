<template>
  <div class="container editing">
    <div class="group">
      <message-input
        ref="input"
        v-model="draft"
        :channel="channel"
        :focus="focus"
        :submit-on-enter="submitOnEnter"
        :user-suggestions="userSuggestions"
        :channel-suggestions="channelSuggestions"
        :current-user="currentUser"
        :source="channelID"
        @submit="onSubmit"
        @focus="onFocus"
        v-on="$listeners"
      />
      <button
        v-if="!hideEmojiButton"
        class="emoji-button input-button"
        @click.stop="onEmojiClick"
      >
        <span class="icon-smile" />
      </button>

      <button
        v-if="!submitOnEnter"
        class="input-button send-button"
        :disabled="submitDisabled"
        @click="onSubmit"
        @mousedown="eventSink"
      >
        <span class="icon-hsend" />
      </button>
    </div>
  </div>
</template>

<script>
import { stringifyDocument, parseDocument } from 'corteza-webapp-messaging/src/components/MessageInput/lib'
import base from 'corteza-webapp-messaging/src/components/Chat/Footer/base'

/**
 * Component handeles inline message editing, updating & deletitions.
 */
export default {
  extends: base,

  props: {
    message: {
      type: Object,
      required: true,
      default: () => ({}),
    },
  },

  data () {
    return {
      draft: parseDocument(this.message.message),
    }
  },

  computed: {
    messageID () {
      return this.message.messageID
    },
  },

  methods: {
    /**
     * Handle input's submit event. Cases:
     *  - if content is empty: prompt message delete
     *  - else: edit the given message
     */
    onSubmit () {
      const message = stringifyDocument(this.draft)
      console.log('x', { message })
      const stdResponse = (m) => {
        this.draft = null
        this.$emit('cancel')
      }

      if (!message) {
        this.$emit('deleteMessage')
      } else if (this.channel) {
        this.$MessagingAPI.messageEdit({ ...this.message, message })
          .then(stdResponse)
      }
    },
  },
}
</script>
<style lang="scss" scoped>
@import 'corteza-webapp-messaging/src/components/Chat/Footer/common.scss';

.container.editing {
  display: inline-block;
  width: 100%;
  padding: 0 10px 0 0;
  overflow: visible;

  .message-input {
    width: 100%;
  }

  .group {
    background-color:white;
  }

  .activity {
    border: none;
    display: none;
  }

}

</style>
