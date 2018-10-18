// initial state
const state = {
  channelPanelOpen: false,
  userPanelOpen: false,
  hasFocus: false,
}

// getters
const getters = {
  isChannelPanelOpen: (state) => state.channelPanelOpen,
  isUserPanelOpen: (state) => state.userPanelOpen,
  hasFocus: (state) => state.hasFocus,
}

// actions
const actions = {
  toggleChannelPanel ({ commit, state }, open) {
    commit('channelPanel', open !== undefined ? open : !state.channelPanelOpen)
  },

  toggleUserPanel ({ commit }, open) {
    commit('userPanel', open !== undefined ? open : !state.userPanelOpen)
  },

  toggleFocus ({ commit }, hasFocus) {
    commit('focus', hasFocus !== undefined ? hasFocus : !state.hasFocus)
  },
}

// mutations
const mutations = {
  channelPanel (state, isOpen) {
    state.channelPanelOpen = isOpen
  },

  userPanel (state, isOpen) {
    state.userPanelOpen = isOpen
  },

  focus (state, hasFocus) {
    state.hasFocus = hasFocus
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
