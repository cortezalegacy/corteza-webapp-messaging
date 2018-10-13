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
  updateList ({ commit }, suggestions) {
    commit('setSuggestions', suggestions)
  },

  setState ({ commit }, state) {
    commit('setState', state)
  },

  setCommands ({ commit }, commands) {
    commit('setCommands', commands)
  },
}

// mutations
const mutations = {
  setSuggestions (state, suggestions) {
    state.suggestions = suggestions
  },

  setState (state, suggestionsOpened) {
    state.suggestionsOpened = suggestionsOpened
  },

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
