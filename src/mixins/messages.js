import { Message } from 'corteza-webapp-messaging/src/types'
import { parseDocument, stringifyDocument } from 'corteza-webapp-messaging/src/components/MessageInput/lib/content'

/**
 * Function extracts user mentions from the given document
 * @param {Object} doc ProseMirror's document object
 * @returns {Array<String>}
 */
function mentionsFromDoc (doc) {
  const mentions = []

  for (const c of doc.content || []) {
    if (!c) {
      break
    }

    if (c.type === 'paragraph') {
      mentions.push(...mentionsFromDoc(c))
    } else if (c.type === 'mention-user') {
      mentions.push(c.attrs.id)
    }
  }
  return mentions
}

/**
 * Function labels a mention in a given document
 * @param {Object} doc ProseMirror's document object
 * @param {Object} users Available users
 */
function labelDocMentions (doc, users) {
  for (const c of doc.content) {
    if (c.type === 'paragraph') {
      labelDocMentions(c, users)
    } else if (c.type === 'mention-user') {
      c.attrs.label = (users[c.attrs.id] || {}).label || c.attrs.label || window.UserNameMask || c.attrs.id
    }
  }
}

/**
 * Provides a state that is ready to work with messages.
 */
export default {
  data () {
    return {
      /**
       * Defines a state for message management
       */
      messages: [],
    }
  },

  created () {
    this.$bus.$on('message.reaction', this.onReaction)
    this.$bus.$on('$core.newMessage', this.onNewMessages)
  },
  beforeDestroy () {
    this.$bus.$off('message.reaction', this.onReaction)
    this.$bus.$off('$core.newMessage', this.onNewMessages)
  },

  watch: {
    source () {
      // Reset state
      this.messages = []
    },

    users: {
      handler: function (users) {
        this.onUsersUpdate(users)
      },
      deep: true,
    },
  },

  methods: {
    /**
     * Loads messages with the given filters.
     * @param {Object} filter searchMessages parameters
     * @returns {Promise<Array<Message>>}
     */
    async messagesLoad ({ filter, noCheck = false, resetState = false }) {
      return this.$MessagingAPI.searchMessages(filter)
        .then(messages => this.onNewMessages(messages, noCheck, resetState))
    },

    /**
     * Loads thread messages with the given filters.
     * @param {Object} filter searchThreads parameters
     * @param {Boolean} noCheck If we should skip source validation
     * @returns {Promise<Array<Message>>}
     */
    async messagesThreadLoad ({ filter, noCheck = false, resetState = false }) {
      return this.$MessagingAPI.searchThreads(filter)
        .then(messages => this.onNewMessages(messages, noCheck, resetState))
    },

    /**
     * Processes new messages and adds them to the state
     * @param {Array<Message>} messages Messages to be added to the state
     * @param {Boolean} noCheck If we should skip source validation
     * @returns {Promise<Array<Message>>}
     */
    async onNewMessages (messages, noCheck = false, resetState = false) {
      if (resetState) {
        this.messages = []
      }

      if (!Array.isArray(messages)) {
        messages = [messages]
      }

      messages = messages
        // Do some source validation -- if it's from a correct channel, ...
        .filter(message => {
          // Relevant for search, bookmarked and pinned messages
          if (noCheck) {
            // If bookmarked or pinned, check if message fits channel
            if (message.isBookmarked || message.isPinned) {
              return message.channelID === this.channelID
            } else {
              return true
            }
          }

          if (message.channelID === this.channelID) {
            if (this.repliesTo) {
              // If message is a reply, return it if it belongs to the thread - if this is being used in a thread
              return message.replyTo === this.repliesTo
            } else if (!this.repliesTo && !message.replyTo) {
              // Else, return the message if it doesnt reply to anything - if this is being used in a channel
              return true
            }
          }
        })
        .map(m => new Message({ ...m, user: this.users[m.userID] || {} }))

      // Add user object for message owner
      messages.forEach(m => {
        m.user = this.users[m.userID] || {}
      })

      // Reactions
      this.enrichReactions(messages)

      // Update states
      this.getUsers(messages)
      this.updateMessages(messages)

      setTimeout(() => {
        // Defer mention enriching to the next cycle
        this.enrichMentions(messages)
      })

      return messages
    },

    /**
     * Adds user objects for given reactions
     * @param {Array<Message>} messages Messages to process
     */
    enrichReactions (messages) {
      for (const m of messages) {
        for (const r of m.reactions) {
          if (!r.users || r.userIDs.length !== r.users.length) {
            r.users = r.userIDs.map(userID => this.users[userID]).filter(u => u)
          }
        }
      }
    },

    /**
     * Enriches message's message to add mention's label
     * @param {Array<Message>} messages A set of messages that should be enriched
     * @returns {Promise<*>}
     */
    async enrichMentions (messages) {
      // Users to fetch
      const userIDs = new Set()
      // Messages to enrich; { messageID, doc } pairs
      const enrich = []

      // extract users
      for (const m of messages) {
        if (m.type === 'channelEvent' || (m.mentions && m.mentions.length)) {
          const doc = parseDocument(m.message)
          const mentions = mentionsFromDoc(doc)
          if (mentions && mentions.length) {
            mentions.forEach(m => userIDs.add(m))
            enrich.push({ messageID: m.messageID, doc })
          }
        }
      }

      // Fetch users
      const users = await this.fetchUsers(userIDs)

      // Update
      const nm = []
      for (const { messageID, doc } of enrich) {
        // Update doc's mentions
        labelDocMentions(doc, users)

        // It has to get fresh message object in case it was updated
        const message = this.messages.find(msg => msg.messageID === messageID)
        nm.push(new Message({ ...message, message: stringifyDocument(doc) }))
      }

      // Update state
      this.updateMessages(nm)
    },

    /**
     * Handle mention selection events.
     * @todo improve options
     * @param {Object} mention Selected mention -- { type, ...rest }
     */
    onMentionSelect (mention) {
      const ch = this.findChannelByMembership(mention.userID, this.$auth.user.userID)
      if (ch) {
        this.$router.push({ name: 'channel', params: ch })
      } else {
        if (this.canCreateGroupChannel) {
          return { name: 'profile', params: mention }
        }
      }
    },

    /**
     * Method updates the current state to add/update new messages.
     *
     * Since both arrays will be sorted, we can use basic array merging, to be
     * as optimal as possible
     * @param {Array<Message>} mm A set of messages to add to the current state
     */
    updateMessages (mm) {
      if (!Array.isArray(mm)) {
        mm = [mm]
      }
      // @todo defer this sorting to the API
      mm.sort((a, b) => a.sortKey.localeCompare(b.sortKey))

      let i = 0
      let j = 0
      for (; i < mm.length; i++) {
        const a = mm[i]

        for (; j < this.messages.length + 1; j++) {
          // If we went over our state's length, we should just append the rest
          if (j >= this.messages.length) {
            this.messages.push(Object.freeze(a))
            j++
            break
          }

          const b = this.messages[j]
          const s = a.sortKey.localeCompare(b.sortKey)
          if (s < 0) {
            // If we passed where we should be, insert before that element
            this.messages.splice(j, 0, Object.freeze(a))
            break
          } if (s === 0) {
            if (a.deletedAt) {
              // Delete message
              this.messages.splice(j, 1)
            } else {
              // Replace with the new element
              this.messages.splice(j, 1, Object.freeze(a))
            }
            break
          }
        }
      }
    },

    /**
     * Updates current messages to reflect current user's state
     * @param {Object<User>} users A new {key: User} object that we should use
     */
    onUsersUpdate (users) {
      this.messages.forEach((m, i) => {
        const nm = new Message(m)
        let update = false

        // If we should define/update message's owner
        if (!m.user || !m.user.userID || (users[m.user] && m.user.online !== users[m.user].online)) {
          nm.user = users[m.userID] || {}
          update = true
        }

        for (const r of nm.reactions) {
          if (!r.users || r.userIDs.length !== r.users.length) {
            // Define reactions
            r.users = r.userIDs.map(userID => this.users[userID]).filter(u => u)
            update = true
          }
        }

        if (update) {
          this.messages.splice(i, 1, Object.freeze(nm))
        }
      })
    },

    /**
     * Creates a reaction and updates the state
     * @param {Object} reaction Reaction
     */
    onReaction (reaction) {
      const i = this.messages.findIndex(m => m.messageID === reaction.messageID)
      if (i < 0) {
        return
      }

      const nm = new Message(this.messages[i])
      if (reaction.add) {
        nm.addReaction(reaction)
      } else {
        nm.removeReaction(reaction)
      }

      this.updateMessages([nm])
    },

    /**
     * Creates a pin and updates the state
     * @param {Message} message Message to pin
     */
    onPinMessage ({ message }) {
      const i = this.messages.findIndex(m => m.messageID === message.messageID)
      if (i < 0) {
        return
      }

      const response = () => {
        const nm = new Message(this.messages[i])
        nm.isPinned = !message.isPinned
        this.updateMessages([nm])
      }

      if (message.isPinned) {
        this.$MessagingAPI.messagePinRemove(message).then(response)
      } else {
        this.$MessagingAPI.messagePinCreate(message).then(response)
      }
    },

    /**
     * Creates a bookmark and updates the state
     * @param {Message} message Message
     */
    onBookmarkMessage ({ message }) {
      const isBookmarked = message.isBookmarked

      // Response updates the state
      const response = () => {
        const nm = new Message(message)
        nm.isBookmarked = !isBookmarked
        this.updateMessages([nm])
      }

      if (message.isBookmarked) {
        this.$MessagingAPI.messageBookmarkRemove(message).then(response)
      } else {
        this.$MessagingAPI.messageBookmarkCreate(message).then(response)
      }
    },

    /**
     * Creates a reaction and updates the state
     * @param {Message} message Message
     * @param {Object} reaction Reaction to handle
     */
    onMessageReaction ({ message, reaction }) {
      const existing = message.reactions.find(r => r.reaction === reaction)
      const ours = existing && Array.isArray(existing.userIDs) && existing.userIDs.indexOf(this.$auth.user.userID) !== -1

      if (existing && ours) {
        this.$MessagingAPI.messageReactionRemove({ ...message, reaction })
      } else {
        this.$MessagingAPI.messageReactionCreate({ ...message, reaction })
      }
    },

    /**
     * Deletes the given message.
     * @param {Message} message Message to delete
     */
    onDeleteMessage ({ message }) {
      if (confirm(this.$t('message.deleteConfirm'))) {
        this.$MessagingAPI.messageDelete(message)
      }
    },
  },
}
