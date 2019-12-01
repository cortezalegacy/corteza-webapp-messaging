import { Message, Channel, User } from 'corteza-webapp-messaging/src/types'

/**
 * Provides a state that is ready to work with users.
 */
export default {
  data () {
    return {
      /**
       * Defines a state for user management
       */
      users: {},
      fetching: new Set(),

      /**
       * Provides a cache to store activities relevant for our users
       */
      activities: [],
    }
  },

  watch: {
    source () {
      // Reset state
      this.users = {}
      this.fetching = new Set()
      this.activities = []
    },
  },

  created () {
    this.$bus.$on('user.activity', this.onActivity)
    this.$root.$on('wake', this.onWakeUsers)

    // Initial activities load
    this.$MessagingAPI.statusList().then(this.updateStatuses)
  },

  beforeDestroy () {
    this.$bus.$off('user.activity', this.onActivity)
    this.$root.$off('wake', this.onWakeUsers)
  },

  methods: {
    /**
     * Fetches users for provided userIDs
     * @param {Array<String>} IDs An array of ID's that we should have
     */
    async fetchUsers (IDs = []) {
      const userIDs = new Set(IDs)
      const fetch = ([...userIDs]).filter(uID => !this.users[uID])
      if (!fetch.length) {
        return this.users
      }

      fetch.forEach(uID => {
        this.fetching.add(uID)
      })

      return this.$SystemAPI.userList({ userID: fetch })
        .then(({ set = [] }) => {
          (set || []).map(user => {
            // Mark me as online
            if (user.userID === this.$auth.user.userID) {
              user.online = true
            }

            this.$set(this.users, user.userID, Object.freeze(new User(user)))
          })

          return this.users
        })
        .finally(() => {
          // Remove fetched users
          fetch.forEach(u => this.fetching.delete(u))
        })
    },

    /**
     * Helper function to pull new users for given resources
     * @param {Array<*>} items Items that contain user references
     * @returns {Set<String>}
     */
    async getUsers (items) {
      if (!Array.isArray(items)) {
        items = [items]
      }

      const userIDs = items.map(item => {
        if (item instanceof Message) {
          return this.getUsersFromMessage(item)
        } else if (item instanceof Channel) {
          return this.getUsersFromChannel(item)
        } else {
          return []
        }
      }).reduce((acc, cur) => new Set([ ...acc, ...cur ]), [])

      return this.fetchUsers(userIDs)
    },

    /**
     * Helper to extract users from a given Message resource
     * @param {Message} message Message in question
     * @returns {Set<String>}
     */
    getUsersFromMessage (message) {
      const { userID, reactions = [] } = message
      return new Set([ userID ].concat(reactions.map(({ userIDs }) => userIDs).reduce((acc, cur) => acc.concat(cur), [])))
    },

    /**
     * Helper to extract users from a given Channel resource
     * @param {Channel} channel Channel in question
     * @returns {Set<String>}
     */
    getUsersFromChannel (channel) {
      return new Set(channel.members)
    },

    /**
     * Handles when the app wakes from a suspended state.
     * Used by hybrid apps
     */
    onWakeUsers () {
      this.$MessagingAPI.statusList().then(this.updateStatuses)
    },

    /**
     * Helper method to apply a given set of activities to our state
     * @param {Array<Object>} activities Activities that we would like to apply
     */
    updateStatuses (activities) {
      // Include cached activities
      activities = activities.concat(this.activities)
      this.activities = []

      activities.forEach(s => {
        if (this.users[s.userID]) {
          // Update user's status
          const u = new User(this.users[s.userID])
          if (s.present) {
            u.online = true
          } else if (s.kind === 'connected') {
            u.online = true
          } else if (s.kind === 'disconnected') {
            u.online = false
          }

          // Ignore stale updates
          if (this.users[s.userID].online === u.online) {
            return
          }

          // Update state & emit update
          this.$set(this.users, s.userID, Object.freeze(u))
          this.$emit('user.update', u)
        } else if (this.fetching.has(s.userID)) {
          // Cache for when the user resolves
          this.activities.push(s)
        }
      })
    },

    /**
     * Handler for new activities
     * @param {Object} activity A new activity to apply
     */
    async onActivity (activity) {
      let u = this.users[activity.userID]
      if (!u) {
        this.activities.push(activity)
        u = await this.fetchUsers(activity.userID)[activity.userID]
        return
      }

      this.updateStatuses([ activity ])
    },
  },

  computed: {
    /**
     * Placeholder, so parent's don't have to implement if not needed
     * @returns {String}
     */
    source () {
      return 'src'
    },
  },
}
