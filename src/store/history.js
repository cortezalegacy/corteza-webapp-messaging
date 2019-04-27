const types = {
  pending: 'pending',
  completed: 'completed',
  notFound: 'notFound',
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

export default function (Messaging) {
  return {
    namespaced: true,
    state: {
      pending: false,
      warning: null,
      set: [],
    },
    getters: {
      pending: (state) => state.pending,
      getByID: (state) => (ID) => state.set.find(m => isValid(m) && m.ID === ID),
      getByChannelID: (state) => (channelID) => state.set.filter(m => isValid(m) && !m.replyTo && m.channelID === channelID),
      getPinned: (state) => state.set.filter(m => isValid(m) && m.isPinned),
      getBookmarked: (state) => state.set.filter(m => isValid(m) && m.isBookmarked),

      unreadInChannel: (state) =>
        (channelID, firstMessageID) =>
          state.set.filter(m => isValid(m) && !m.replyTo && m.channelID === channelID && (firstMessageID || 0) <= m.ID),

      getThread: (state) => (messageID) => state.set.filter(m => isValid(m) && (m.ID === messageID || m.replyTo === messageID)),

      getThreads: (state) =>
        // @todo this should be sorted by date/id of the last message in the thread
        [...state.set.filter(m => isValid(m) && !m.replyTo && m.replies > 0)]
          .sort((a, b) => b.ID - a.ID),
    },

    actions: {
      async delete ({ commit, state }, { channelID, messageID }) {
        commit(types.pending)
        Messaging.messageDelete({ channelID, messageID }).then(() => {
          commit(types.removeFromSet, messageID)
          commit(types.completed)
        })
      },

      async pin ({ commit, getters }, { channelID, messageID, isPinned }) {
        commit(types.pending)
        const response = () => {
          const msg = getters.getByID(messageID)
          if (msg) {
            commit(types.setPin, { msg, isPinned: !isPinned })
            commit(types.updateSet, [msg])
          } else {
            commit(types.notFound)
          }
          commit(types.completed)
        }

        if (isPinned) {
          Messaging.messagePinRemove({ channelID, messageID }).then(response)
        } else {
          Messaging.messagePinCreate({ channelID, messageID }).then(response)
        }
      },

      async bookmark ({ commit, getters }, { channelID, messageID, isBookmarked }) {
        commit(types.pending)
        const response = () => {
          const msg = getters.getByID(messageID)
          if (msg) {
            commit(types.setBookmark, { msg, isBookmarked: !isBookmarked })
            commit(types.updateSet, [msg])
          } else {
            commit(types.notFound)
          }
          commit(types.completed)
        }
        if (isBookmarked) {
          Messaging.messageBookmarkRemove({ channelID, messageID }).then(response)
        } else {
          Messaging.messageBookmarkCreate({ channelID, messageID }).then(response)
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

      [types.notFound] (state) {
        state.warning = true
      },

      [types.updateSet] (state, set) {
        if (state.set.length === 0) {
          // Plain & simple
          state.set = set
        } else {
          set.forEach(msg => {
            // Replaces given msg due to an update
            const n = state.set.findIndex(m => m.ID === msg.ID)

            // Doesn't yet exist -- add it
            if (n < 0) {
              state.set.push(msg)
            } else {
              state.set.splice(n, 1, msg)
            }
          })
        }

        state.set.sort((a, b) => a.ID.localeCompare(b.ID))
      },

      [types.setPin] (state, { msg, isPinned }) {
        msg.isPinned = isPinned
      },

      [types.setBookmark] (state, { msg, isBookmarked }) {
        msg.isBookmarked = isBookmarked
      },

      [types.addReaction] (state, { msg, userID, reaction }) {
        msg.addReaction({ userID, reaction })
      },

      [types.removeReaction] (state, { msg, userID, reaction }) {
        msg.removeReaction({ userID, reaction })
      },

      [types.clearSet] (state) {
        state.set.splice(0)
      },

      [types.removeFromSet] (state, ...IDs) {
        state.set = [...state.set.filter(m => IDs.indexOf(m.ID) < 0)]
      },
    },
  }
}
