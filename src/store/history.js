// initial state
const state = {
  set: [],
}

// getters
const getters = {
  get: (state) => state.set,
  getFirstId: (state) => (state.set[0] || {}).ID,
  getLastId: (state) => (state.set[state.set.length - 1] || {}).ID,
}

// actions
const actions = {
  pushSingle ({ commit, state }, msg) {
    commit('pushSingle', msg)
  },

  push ({ commit, state }, msg) {
    commit('push', msg)
  },

  clear ({ commit }) {
    commit('clear')
  },
}

// mutations
const mutations = {
  pushSingle (state, msg) {
    // Is there an existing message?
    const n = state.set.findIndex(m => m.ID === msg.ID)

    // Doesn't yet exist -- add it
    if (n < 0) {
      // Push msg to either top or back
      // Check timestamp to determine where in array to push it to
      if (state.set.length > 0 && state.set[0].ID > msg.ID) {
        state.set.unshift(msg)
      } else {
        state.set.push(msg)
      }
    } else {
      state.set.splice(n, 1, msg)
    }
  },

  push (state, set) {
    // Sort the input first...
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
