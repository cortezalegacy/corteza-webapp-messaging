
const types = {
  pending: 'pending',
  completed: 'completed',
  setCommands: 'setCommands',
}

export default function (Messaging) {
  return {
    namespaced: true,
    state: {
      suggestions: [],
      suggestionsOpened: false,
      commands: [],
      pending: false,
    },
    getters: {
      getSuggestions: (state) => state.suggestions,
      isOpened: (state) => state.suggestionsOpened,

      getCommands: (state) => state.commands,
      getCommand: (state) => (command) => state.commands.find(c => c.command === command),
      pending: (state) => state.pending,
    },
    actions: {},
    mutations: {
      [types.pending] (state) {
        state.pending = true
      },

      [types.completed] (state) {
        state.pending = false
      },

      [types.setCommands] (state, commands) {
        state.commands = commands
      },
    },
  }
}
