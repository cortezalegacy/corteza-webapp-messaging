const state = {
  suggestions: [],
  suggestionsOpened: false,
  slashCommands: [],
}

// getters
const getters = {
  getSuggestions: (state) => state.suggestions,
  isOpened: (state) => state.suggestionsOpened,
  getSlashCommands: (state) => state.slashCommands,
}

// actions
const actions = {
  setCommands ({ commit }, commands) {
    commit('setCommands', commands)
  },
}

// mutations
const mutations = {
  setCommands (state, commands) {
    state.slashCommands = commands
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
