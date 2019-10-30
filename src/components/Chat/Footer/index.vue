<template>
  <div
    class="container"
    :class="{
      inThread: !!replyTo,
    }"
  >
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
        :source="source"
        @submit="onSubmit"
        @focus="onFocus"
        v-on="$listeners"
      >
        <template slot="sectionLeft">
          <button
            v-if="!hideUpload"
            class="upload-button input-button"
            @click="onPromptFilePicker"
          >
            <span>+</span>
          </button>
        </template>

        <template slot="sectionRight">
          <!-- Add media buttons -->
          <button
            v-if="!hideEmojiButton"
            class="emoji-button input-button"
            @click.prevent="onEmojiClick"
          >
            <span class="icon-smile" />
          </button>

          <!-- Media source s for the hybrid app -->
          <button
            v-if="showCameraSource"
            class="camera-button input-button"
            @click.stop="onPromptCamera"
          >
            <font-awesome-icon icon="camera" />
          </button>
          <button
            v-if="showGalerySource"
            class="galery-button input-button"
            @click.stop="onPromptGalery"
          >
            <font-awesome-icon icon="images" />
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
        </template>
      </message-input>

      <div class="meta-bar container">
        <activity
          v-if="!replyTo"
          :users="getChannelActivity"
          :activity="$t('message.typing')"
        />

        <button
          v-if="hasUnread"
          class="btn float-right"
          @click.prevent="onMarkAsRead"
        >
          {{ $t('message.markAsRead') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Activity from './Activity'
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
    Activity,
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
  },

  computed: {
    ...mapGetters({
      channelActivity: 'users/channelActivity',
    }),

    replyToID () {
      return (this.replyTo || {}).messageID
    },

    /**
     * Helper to get channel activities -- eg.: who's typing.
     * @returns {Array}
     */
    getChannelActivity () {
      return this.channelActivity(this.channelID, 'typing')
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
      deep: true,
    },

    replyToID: {
      handler: function (nID, oID) {
        // On thread change, reload draft
        if (oID) {
          this.flushDraft(this.channelID, oID)
        }
        this.draft = this.loadDraft(this.channelID, nID)
      },
      immediate: true,
      deep: true,
    },

    draft: {
      handler: function (d) {
        this.sendActivity(!d)
      },
      deep: true,
    },
  },

  beforeDestroy () {
    this.flushDraft(this.channelID, this.replyToID)
  },

  methods: {
    ...mapActions({
      markAllAsRead: 'unread/markChannelAsRead',
    }),

    /**
     * Handle input's submit event. Cases:
     *  - if replying to a message: create a thread message
     *  - if it's a command: execute the command
     *  - else: create a message
     */
    onSubmit () {
      if (this.submitDisabled) {
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
     * Handler to set current user's activity; eg.: typing.
     * @param {Boolean} empty If current draft's value is empty
     */
    sendActivity: throttle(function (empty) {
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
    }, 2000),

    /**
     * Mark entire channel as read
     */
    onMarkAsRead () {
      this.markAllAsRead(this.channel)
    },
  },
}
</script>

<style lang="scss" scoped>
@import 'corteza-webapp-messaging/src/components/Chat/Footer/common.scss';

</style>
