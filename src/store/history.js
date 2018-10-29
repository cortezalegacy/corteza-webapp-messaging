// initial state
const state = {
  set: [],
}

// Basic message filtering
const isValid = (msg) => msg.deletedAt === null

// getters
const getters = {
  getByID: (state) => (ID) => state.set.find(m => isValid(m) && m.ID === ID),
  getByChannelID: (state) => (channelID) => state.set.filter(m => isValid(m) && m.replyTo === 0 && m.channelID === channelID),
  unreadInChannel: (state) =>
    (channelID, firstMessageID) =>
      state.set.filter(m => isValid(m) && m.replyTo === 0 && m.channelID === channelID && (firstMessageID || 0) <= m.ID),
  getThread: (state) => (messageID) => state.set.filter(m => isValid(m) && (m.ID === messageID || m.replyTo === messageID)),

  getThreads: (state) =>
    state.set.filter(m => isValid(m) && m.replyTo === 0 && m.replies > 0),
}

// actions
const actions = {
  update ({ commit, state }, messages) {
    commit('update', messages)
  },

  clear ({ commit }) {
    commit('clear')
  },
}

// mutations
const mutations = {
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
}

export default {
  namespaced: true,
  strict: true,
  state,
  getters,
  actions,
  mutations,
}
