export default function (Messaging) {
  return {
    namespaced: true,
    state: {
      suggestions: [],
      suggestionsOpened: false,
      commands: [],
    },
    getters: {
      getSuggestions: (state) => state.suggestions,
      isOpened: (state) => state.suggestionsOpened,

      getCommands: (state) => state.commands,
      getCommand: (state) => (command) => state.commands.find(c => c.command === command),
    },
    actions: {},
    mutations: {
      setCommands (state, commands) {
        state.commands = commands
      },
    },
  }
}
