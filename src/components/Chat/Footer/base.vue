<script>
import { mapGetters } from 'vuex'
import MessageInput from 'corteza-webapp-messaging/src/components/MessageInput'
import { getDraft, contentEmpty } from 'corteza-webapp-messaging/src/components/MessageInput/lib'

/**
 * This base component should be extended by any components that provide
 * message creation. It provides base props & helper functions.
 */
export default {
  components: {
    MessageInput,
  },

  props: {
    channel: {
      type: Object,
      required: true,
      default: () => ({}),
    },

    hideUpload: {
      type: Boolean,
      required: false,
      default: false,
    },

    focus: {
      type: Boolean,
      required: false,
      default: false,
    },

    submitOnEnter: {
      type: Boolean,
      required: false,
      default: false,
    },

    readonly: {
      type: Boolean,
      required: false,
      default: false,
    },

    hideEmojiButton: {
      type: Boolean,
      required: false,
      default: false,
    },

    showCameraSource: {
      type: Boolean,
      required: false,
      default: !!process.env.CORDOVA_PLATFORM,
    },
    showGallerySource: {
      type: Boolean,
      required: false,
      default: !!process.env.CORDOVA_PLATFORM,
    },

    suggestionPriorities: {
      type: Object,
      required: false,
      default: () => ({}),
    },
  },

  data () {
    return {
      draft: null,
    }
  },

  computed: {
    ...mapGetters({
      users: 'users/list',
      channels: 'channels/list',
      statuses: 'users/statuses',
    }),

    channelID () {
      return this.channel.channelID
    },

    /**
     * Determines available channel suggestions. These values are already
     * pre-processed by the fuzzy search library.
     * @returns {Array}
     */
    channelSuggestions () {
      return this.channels.map(c => {
        return {
          type: 'Channel',
          id: c.channelID,
          channel: c,
          value: c.suggestionLabel(),
          ...c.fuzzyKeys(),
        }
      })
    },

    /**
     * Helper to provide a set of online user statuses.
     * This is moved outside of `userSuggestions`, so it won't be re-evaluated
     * if some user bit changes.
     * @returns {Array}
     */
    onlineStatuses () {
      return new Set(this.statuses.filter(s => s.present === 'online').map(s => s.userID))
    },

    /**
     * Determines available user suggestions. These values are already
     * pre-processed by the fuzzy search library.
     * @returns {Array}
     */
    userSuggestions () {
      return this.users.map(u => {
        return {
          type: 'User',
          id: u.userID,
          user: u,
          value: u.suggestionLabel(),
          online: this.onlineStatuses.has(u.userID),
          ...u.fuzzyKeys(),
        }
      })
    },

    currentUser () {
      return this.$auth.user
    },

    /**
     * Determines if submit should be ignored.
     * @returns {Boolean}
     */
    submitDisabled () {
      return contentEmpty(this.draft)
    },
  },

  methods: {
    /**
     * Handler for prompting emoji picker. It creates a callback that inserts
     * the emoji at current position.
     */
    onEmojiClick () {
      const input = this.$refs.input
      this.$bus.$emit('ui.openEmojiPicker', {
        callback: ({ colons, native }) => {
          input.insert({ content: native || colons })
          input.focus()
        },
      })
    },

    /**
     * Helper to prompt camera to capture an attachment.
     * Currently only used by hybrid app.
     */
    onPromptCamera () {
      this.onPromptFilePicker(window.Camera.PictureSourceType.CAMERA)
    },

    /**
     * Helper to prompt attachment selection from galery.
     * Currently only used by hybrid app.
     */
    onPromptGallery () {
      this.onPromptFilePicker(window.Camera.PictureSourceType.PHOTOLIBRARY)
    },

    /**
     * Helper to prompt file picker.
     * @param {String} sourceType What source the picker should use.
     */
    onPromptFilePicker (sourceType) {
      this.$emit('promptFilePicker', { sourceType })
    },

    /**
     * Flush current draft to localStorage
     * @param {String} channelID current channelID
     * @param {String} messageID current messageID - needed for threads
     */
    flushDraft (channelID, messageID) {
      const d = this.draft
      if (d) {
        this.$drafts.set({ channelID, messageID }, d)
      } else {
        this.$drafts.remove({ channelID, messageID })
      }
    },

    /**
     * Load currently relavant draft
     * @param {String} channelID current channelID
     * @param {String} messageID current messageID - needed for threads
     * @returns {Object|null}
     */
    loadDraft (channelID, messageID) {
      return getDraft(this.$drafts.get({ channelID, messageID }))
    },

    /**
     * Handle input's submit event.
     * Each implementing component should provide their own.
     */
    onSubmit () {
      throw new Error('method.onSubmit.shouldOverwrite')
    },

    /**
     * On input focus handler
     */
    onFocus () {
      this.$bus.$emit('ui.closeEmojiPicker')
    },
  },
}
</script>
