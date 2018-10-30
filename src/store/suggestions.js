const state = {
  suggestions: [],
  suggestionsOpened: false,
  commands: [],
}

// getters
const getters = {
  getSuggestions: (state) => state.suggestions,
  isOpened: (state) => state.suggestionsOpened,

  getCommands: (state) => state.commands,
  getCommand: (state) => (command) => state.commands.find(c => c.command === command),
}

// actions
const actions = {}

// mutations
const mutations = {
  setCommands (state, commands) {
    state.commands = commands
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
