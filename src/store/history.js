// initial state
const state = {
  set: [],
}

// getters
const getters = {
  get: (state) => state.set.filter(m => m.replyTo === 0),
  getFirstId: (state) => (state.set[0] || {}).ID,
  getLastId: (state) => (state.set[state.set.length - 1] || {}).ID,
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
