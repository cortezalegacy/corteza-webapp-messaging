<script>
import { mapGetters } from 'vuex'
import MessageInput from 'corteza-webapp-messaging/src/components/MessageInput'
import { getDraft, contentEmpty } from 'corteza-webapp-messaging/src/components/MessageInput/lib'
import { Activity, activityTTL } from './types'
import CActivity from './Activity'
import { User } from 'corteza-webapp-messaging/src/types'
import { throttle } from 'lodash'

const maxUserSuggestions = 10

/**
 * This base component should be extended by any components that provide
 * message creation. It provides base props & helper functions.
 */
export default {
  components: {
    // eslint-disable-next-line
    MessageInput,
    // eslint-disable-next-line
    CActivity,
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

    users: {
      type: Object,
      required: true,
    },
  },

  data () {
    return {
      draft: null,
      channelActivities: [],

      pulledUsers: [],
      prioritizedUsers: [],
      userStatuses: {},

      activityTimeout: undefined,
    }
  },

  computed: {
    ...mapGetters({
      channels: 'channels/list',
    }),

    /**
     * Provides all available user suggestions
     * @returns {Array<Object>}
     */
    userSuggestions () {
      return this.prioritizedUsers.concat(this.pulledUsers)
        .map(s => ({ ...s, online: this.userStatuses[s.id] }))
    },

    /**
     * Provides user objects for given activity
     * @returns {Array<User>}
     */
    activityUsers () {
      return this.channelActivities.map(({ userID }) => this.users[userID])
    },

    /**
     * Helper to get channel activities -- eg.: who's typing.
     * @returns {Array}
     */
    getChannelActivity () {
      return this.channelActivity
    },

    channelID () {
      return this.channel.channelID
    },

    /**
     * Determines available channel suggestions. These values are already
     * pre-processed by the fuzzy search library.
     * @returns {Array}
     */
    channelSuggestions () {
      return this.channels
        .filter(c => c.type !== 'group')
        .map(c => {
          return {
            type: 'Channel',
            id: c.channelID,
            channel: c,
            value: c.suggestionLabel(),
            ...c.fuzzyKeys(),
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

  watch: {
    suggestionPriorities: {
      handler: function (ps) {
        if (ps.User) {
          // Fetch new prioritized users
          this.$SystemAPI.userList({ userID: [...ps.User] })
            .then(e => {
              this.prioritizedUsers = e.set.map(u => new User(u)).map(this.prepUserSuggestion)
            })
        }
      },
      deep: true,
      immediate: true,
    },
  },

  created () {
    this.$bus.$on('user.activity', this.onActivity)
    this.statusCleanup()
  },

  beforeDestroy () {
    this.$bus.$off('user.activity', this.onActivity)
    window.clearTimeout(this.activityTimeout)
  },

  methods: {
    /**
     * Fetches new suggestions of the given type for the given query
     * @param {String} type Type of suggestions
     * @param {String} query Query to use
     */
    onRequestSuggestions: throttle(function ({ type, query }) {
      if (type === 'user') {
        // Get statuses so we can show who is online
        this.loadStatuses()

        this.$SystemAPI.userList({ query, perPage: maxUserSuggestions })
          .then(({ set: users = [] }) => {
            this.pulledUsers.push(
              ...(users || [])
                .filter(u => !this.userSuggestions.find(({ id }) => id === u.userID))
                .map(u => new User(u)).map(this.prepUserSuggestion)
            )

            // Limit how manny we can have at once
            if (this.pulledUsers.length > maxUserSuggestions) {
              this.pulledUsers.splice(this.pulledUsers.length - maxUserSuggestions - 1, this.pulledUsers.length)
            }
          })
      }
    }, 500),

    /**
     * Handle suggest start; initial status load
     */
    onSuggestStart () {
      this.loadStatuses()
    },

    /**
     * Handle suggest end; clear out statuses
     */
    onSuggestEnd () {
      this.userStatuses = {}
    },

    /**
     * Helper to load & prepare user statuses
     * @todo improve this when we migrate to new structure
     */
    loadStatuses () {
      this.$MessagingAPI.statusList().then(s => {
        this.userStatuses = s.reduce((acc, cur) => {
          acc[cur.userID] = true
          return acc
        }, { [this.currentUser.userID]: true })
      })
    },

    /**
     * Pre-processes user suggestions into fuzzy-search objects + meta
     * @returns {Object}
     */
    prepUserSuggestion (u) {
      return {
        type: 'User',
        id: u.userID,
        user: u,
        value: u.suggestionLabel(),
        online: false,
        member: !!this.channel.members.find(uID => uID === u.userID),
        ...u.fuzzyKeys(),
      }
    },

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
     * Cleanup stale statuses
     */
    statusCleanup () {
      this.activityTimeout = window.setTimeout(() => {
        this.channelActivities = this.channelActivities.filter(s => !s.isStale(activityTTL))
        this.statusCleanup()
      }, activityTTL)
    },

    /**
     * Handle activities
     * @param {Object} activity Activity to process
     */
    onActivity (activity) {
      if (activity.userID === this.currentUser.userID) {
        return
      }

      if (activity.channelID !== this.channelID) {
        return
      }

      const handle = () => {
        const i = this.channelActivities.findIndex(Activity.activityFinder(activity))
        if (i > -1) {
          this.channelActivities.splice(i, 1, this.channelActivities[i].update())
        } else {
          this.channelActivities.push(new Activity(activity))
        }
      }

      if (activity.kind === 'typing') {
        handle()
      }
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
      if (this.$s('Message.Attachments.Enabled', true)) {
        this.$emit('promptFilePicker', { sourceType })
      }
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
