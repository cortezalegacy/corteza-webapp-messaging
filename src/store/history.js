// Basic message filtering
const isValid = (msg) => msg.deletedAt === null

export default function (Messaging) {
  return {
    namespaced: true,
    state: {
      set: [],
    },
    getters: {
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
      update ({ commit, state }, messages) {
        commit('update', messages)
      },

      clear ({ commit }) {
        commit('clear')
      },
    },
    mutations: {
      update (state, set) {
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

      clear (state) {
        state.set.splice(0)
      },
    },
  }
}
