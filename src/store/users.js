// initial state
const state = {
  list: [],
}

// getters
const getters = {
  list: (state) => state.list,
  length: (state) => state.list.length,
  findByID: (state) => (ID) => state.list.find(u => ID === u.ID),

}

// actions
const actions = {
  resetList ({ commit }, list) {
    commit('resetList', list)
  },

  connected ({ commit }, id) {
    commit('incConnected', id)
  },

  disconnected ({ commit }, id) {
    commit('decConnected', id)
  },
}

// mutations
const mutations = {
  resetList (state, users) {
    state.list = users
  },

  incConnected (state, ID) {
    state.list.forEach((user) => {
      if (user.ID === ID) {
        user.connections++
        console.debug('User connected', user.ID, user.name, user.username, user.handle)
      }
    })
  },

  decConnected (state, ID) {
    state.list.forEach((user) => {
      if (user.ID === ID) {
        user.connections = (user.connections > 0 ? user.connections - 1 : 0)
        console.debug('User disconnected', user.ID, user.name, user.username, user.handle)
      }
    })
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
