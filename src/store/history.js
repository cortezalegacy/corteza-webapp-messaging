const types = {
  pending: 'pending',
  completed: 'completed',
  updateSet: 'updateSet',
  setPin: 'setPin',
  setBookmark: 'setBookmark',
  addReaction: 'addReaction',
  removeReaction: 'removeReaction',
  clearSet: 'clearSet',
  removeFromSet: 'removeFromSet',
}

// Basic message filtering
const isValid = (msg) => msg.deletedAt === null

export default function (MessagingAPI) {
  return {
    namespaced: true,
    state: {
      pending: false,
      set: [],
    },
    getters: {
      pending: (state) => state.pending,
      getByID: (state) => (ID) => state.set.find(m => isValid(m) && m.messageID === ID),
      getByChannelID: (state) => (channelID) => state.set.filter(m => isValid(m) && !m.replyTo && m.channelID === channelID),
      getPinned: (state) => state.set.filter(m => isValid(m) && m.isPinned),
      getBookmarked: (state) => state.set.filter(m => isValid(m) && m.isBookmarked),

      getThread: (state) => (messageID) => state.set.filter(m => isValid(m) && (m.messageID === messageID || m.replyTo === messageID)),

      getThreads: (state) =>
        // @todo this should be sorted by date/id of the last message in the thread
        [...state.set.filter(m => isValid(m) && !m.replyTo && m.replies > 0)]
          .sort((a, b) => b.messageID - a.messageID),
    },

    actions: {
      delete ({ commit, state }, { channelID, messageID }) {
        commit(types.pending)
        MessagingAPI.messageDelete({ channelID, messageID }).then(() => {
          commit(types.removeFromSet, messageID)
          commit(types.completed)
        })
      },

      pin ({ commit, getters }, { channelID, messageID, isPinned }) {
        commit(types.pending)
        const response = () => {
          const message = getters.getByID(messageID)
          if (message) {
            commit(types.setPin, { message, isPinned: !isPinned })
          }
          commit(types.completed)
        }

        if (isPinned) {
          MessagingAPI.messagePinRemove({ channelID, messageID }).then(response)
        } else {
          MessagingAPI.messagePinCreate({ channelID, messageID }).then(response)
        }
      },

      // Called from pin() and websocket handler
      pinned ({ commit, getters }, { messageID }) {
        const message = getters.getByID(messageID)

        if (message) {
          commit(types.setPin, { message, isPinned: true })
        }
      },

      // Called from pin() and websocket handler
      unpinned ({ commit, getters }, { messageID }) {
        const message = getters.getByID(messageID)

        if (message) {
          commit(types.setPin, { message, isPinned: false })
        }
      },

      reactionAdded ({ commit, getters }, { messageID, userID, reaction }) {
        const message = getters.getByID(messageID)

        if (message) {
          commit(types.addReaction, { message, userID, reaction })
        }
      },

      reactionRemoved ({ commit, getters }, { messageID, userID, reaction }) {
        const message = getters.getByID(messageID)

        if (message) {
          commit(types.removeReaction, { message, userID, reaction })
        }
      },

      bookmark ({ commit, getters }, { channelID, messageID, isBookmarked }) {
        commit(types.pending)
        const response = () => {
          const message = getters.getByID(messageID)
          if (message) {
            isBookmarked = !isBookmarked
            commit(types.setBookmark, { message, isBookmarked })
          }
          commit(types.completed)
        }

        if (isBookmarked) {
          MessagingAPI.messageBookmarkRemove({ channelID, messageID }).then(response)
        } else {
          MessagingAPI.messageBookmarkCreate({ channelID, messageID }).then(response)
        }
      },

      update ({ commit, state }, messages) {
        commit(types.updateSet, messages)
      },
    },

    mutations: {
      [types.pending] (state) {
        state.pending = true
      },

      [types.completed] (state) {
        state.pending = false
      },

      [types.updateSet] (state, set) {
        updateSet(state, set)
      },

      [types.setPin] (state, { message, isPinned }) {
        message.isPinned = isPinned
        updateSet(state, [message])
      },

      [types.setBookmark] (state, { message, isBookmarked }) {
        message.isBookmarked = isBookmarked
        updateSet(state, [message])
      },

      [types.addReaction] (state, { message, userID, reaction }) {
        message.addReaction({ userID, reaction })
        updateSet(state, [message])
      },

      [types.removeReaction] (state, { message, userID, reaction }) {
        message.removeReaction({ userID, reaction })
        updateSet(state, [message])
      },

      [types.clearSet] (state) {
        state.set.splice(0)
      },

      [types.removeFromSet] (state, ...messageIDs) {
        state.set = [...state.set.filter(m => messageIDs.indexOf(m.messageID) < 0)]
      },
    },
  }
}

const updateSet = (state, set) => {
  let sort = false

  if (state.set.length === 0) {
    // Plain & simple
    state.set = set
    sort = true
  } else {
    set.forEach(msg => {
      // Replaces given msg due to an update
      const n = state.set.findIndex(m => m.messageID === msg.messageID)

      // Doesn't yet exist -- add it
      if (n < 0) {
        state.set.push(msg)
        sort = true
      } else {
        state.set.splice(n, 1, msg)
      }
    })
  }

  if (sort) {
    state.set.sort((a, b) => a.messageID.localeCompare(b.messageID))
  }
}
