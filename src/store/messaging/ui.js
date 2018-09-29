// initial state
const state = {
  channelPanelOpen: false,
  userPanelOpen: false
}

// getters
const getters = {
  isChannelPanelOpen: (state) => state.channelPanelOpen,
  isUserPanelOpen: (state) => state.userPanelOpen
}

// actions
const actions = {
  toggleChannelPanel ({commit, state}, open) {
    commit('channelPanel', open !== undefined ? open : !state.channelPanelOpen)
  },

  toggleUserPanel ({commit}, open) {
    commit('userPanel', open !== undefined ? open : !state.userPanelOpen)
  }
}

// mutations
const mutations = {
  channelPanel (state, isOpen) {
    state.channelPanelOpen = isOpen
  },

  userPanel (state, isOpen) {
    state.userPanelOpen = isOpen
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
