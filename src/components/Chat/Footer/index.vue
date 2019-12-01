<template>
  <observer-footer
    v-if="readonly"
    :channel="channel"
  />

  <div
    v-else
    class="container"
    :class="{
      inThread: !!replyTo,
    }"
  >
    <div class="group float-left">
      <message-input
        ref="input"
        v-model="draft"
        class="message-input float-right"
        :channel="channel"
        :focus="focus"
        :submit-on-enter="submitOnEnter"
        :user-suggestions="userSuggestions"
        :channel-suggestions="channelSuggestions"
        :current-user="currentUser"
        :source="source"
        :suggestion-priorities="suggestionPriorities"
        @submit="onSubmit"
        @focus="onFocus"
        @requestSuggestions="onRequestSuggestions"
        v-on="$listeners"
      />

      <button
        v-if="!hideUpload"
        class="upload-button input-button"
        :class="{ 'not-allowed': !enableAttachments }"
        :disabled="!enableAttachments"
        @mousedown.stop.prevent="onPromptFilePicker"
      >
        <span>+</span>
      </button>

      <!-- Add media buttons -->
      <button
        v-if="!hideEmojiButton && $s('UI.Emoji.Enabled', true)"
        class="emoji-button input-button"
        @mousedown.stop.prevent="onEmojiClick"
      >
        <span class="icon-smile" />
      </button>

      <!-- Media source s for the hybrid app -->
      <button
        v-if="enableAttachments && showCameraSource && $s('Message.Attachments.Source.Camera.Enabled', true)"
        class="camera-button input-button"
        @mousedown.stop.prevent="onPromptCamera"
      >
        <font-awesome-icon icon="camera" />
      </button>
      <button
        v-if="enableAttachments && showGallerySource && $s('Message.Attachments.Source.Gallery.Enabled', true)"
        class="gallery-button input-button"
        @mousedown.stop.prevent="onPromptGallery"
      >
        <font-awesome-icon icon="images" />
      </button>

      <button
        v-if="!submitOnEnter"
        class="input-button send-button"
        :disabled="submitDisabled"
        @mousedown.stop.prevent="onSubmit"
      >
        <span class="icon-hsend" />
      </button>
    </div>

    <div class="group borderless float-left">
      <div class="meta-bar">
        <c-activity
          class="activity"
          :users="activityUsers"
          :activity="$t('message.typing')"
        />

        <button
          v-if="hasUnread"
          class="btn float-right"
          @click.prevent="$emit('markAsRead')"
        >
          {{ $t('message.markAsRead') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ObserverFooter from './ObserverFooter'
import { stringifyDocument } from 'corteza-webapp-messaging/src/components/MessageInput/lib'
import { throttle } from 'lodash'
import base from './base'

// Provides a set of available activity kinds.
const activityKinds = {
  editing: 'editing',
  replying: 'replying',
  typing: 'typing',
}

export default {
  components: {
    ObserverFooter,
  },

  extends: base,

  props: {
    replyTo: {
      type: Object,
      required: false,
      default: undefined,
    },

    hasUnread: {
      type: Boolean,
      required: false,
      default: false,
    },

    readonly: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    enableAttachments () {
      return this.$s('Message.Attachments.Enabled', true)
    },

    replyToID () {
      return (this.replyTo || {}).messageID
    },

    /**
     * Helper to determine unique source identifier, based on channel and thread.
     * Used by MessageInput for some internal operations
     * @returns {String}
     */
    source () {
      return `${this.channelID}${this.replyToID || ''}`
    },
  },

  watch: {
    channelID: {
      handler: function (nID, oID) {
        // On source change, update drafts
        if (oID) {
          this.flushDraft(oID, this.replyToID)
        }
        this.draft = this.loadDraft(nID, this.replyToID)
      },
      immediate: true,
    },

    replyToID: {
      handler: function (nID, oID) {
        if (!nID) {
          return
        }

        // On thread change, reload draft
        if (oID) {
          this.flushDraft(this.channelID, oID)
        }
        this.draft = this.loadDraft(this.channelID, nID)
      },
    },

    draft: {
      handler: function (d) {
        this.sendActivityDebounced(!d)
      },
      deep: true,
    },
  },

  beforeDestroy () {
    this.flushDraft(this.channelID, this.replyToID)
  },

  methods: {
    /**
     * Handle input's submit event. Cases:
     *  - if replying to a message: create a thread message
     *  - if it's a command: execute the command
     *  - else: create a message
     */
    onSubmit (submit) {
      // explicit check for false since undefined can happen
      if (this.submitDisabled || submit === false) {
        return
      }

      const message = stringifyDocument(this.draft)
      if (!message) {
        return
      }

      const mapi = this.$MessagingAPI

      const stdResponse = (m) => {
        this.draft = null
        this.$emit('cancel')

        // Clear current draft
        this.flushDraft(this.channelID, (this.replyTo || {}).messageID)
      }

      if (this.replyTo) {
        // Create a reply
        mapi.messageReplyCreate({ channelID: this.replyTo.channelID, messageID: this.replyTo.messageID, message })
          .then(stdResponse)
      } else if (this.channel) {
        // Attempt to exec the command
        if (this.$commands.test(message)) {
          this.$commands.exec(this, message, { channel: this.channel })
          return stdResponse()
        }

        // Create a message
        mapi.messageCreate({ channelID: this.channel.channelID, message })
          .then(stdResponse)
      }
    },

    /**
     * Wrapper to debounce activity sending. Used for testing.
     */
    sendActivityDebounced: throttle(function (...e) { this.sendActivity(...e) }, 2000),

    /**
     * Handler to set current user's activity; eg.: typing.
     * @param {Boolean} empty If current draft's value is empty
     */
    sendActivity (empty) {
      let params
      if (empty) {
        return
      } else if (this.replyTo !== undefined) {
        params = { channelID: this.replyTo.channelID, messageID: this.replyTo.messageID, kind: activityKinds.replying }
      } else {
        params = { channelID: this.channelID, kind: activityKinds.typing }
      }

      if (params) {
        this.$MessagingAPI.activitySend(params)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
@import 'corteza-webapp-messaging/src/components/Chat/Footer/common.scss';

.container .meta-bar {
  min-height: 25px;
  width: 100%;
  display: inline-block;
  border: 1px solid transparent;

  .activity {
    position: absolute;
    margin-top: 2px;
  }
}

.not-allowed {
  cursor: not-allowed !important;
}
</style>
