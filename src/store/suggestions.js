import localCommands from '@/commands'

const types = {
  pending: 'pending',
  completed: 'completed',
  updateCommands: 'updateCommands',
  updateApi: 'updateApi',
}

export default function (Messaging) {
  return {
    namespaced: true,
    state: {
      Messaging,
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
    actions: {
      async loadCommands ({ commit, state }) {
        commit(types.pending)
        state.Messaging.commandsList().then((commands) => {
          commit(types.updateCommands, commands)
          commit(types.completed)
        })
      },
    },
    mutations: {
      [types.updateApi] (state, { Messaging }) {
        state.Messaging = Messaging
      },

      [types.pending] (state) {
        state.pending = true
      },

      [types.completed] (state) {
        state.pending = false
      },

      [types.updateCommands] (state, commands) {
        commands = commands.map(c => ({
          command: c.name,
          description: c.description,
          params: [],
          meta: {},
          handler: (vm, { channel, params, input }) => {
            state.Messaging.messageExecuteCommand({ channelID: channel.channelID, command: c.name, input, params })
          },
        })).concat(localCommands)

        if (state.commands.length === 0) {
          state.commands = commands
        } else {
          commands.forEach(cmd => {
            // Replaces given cmd due to an update
            const n = state.commands.findIndex(c => c.command === cmd.command)

            // Doesn't yet exist -- add it
            if (n < 0) {
              state.commands.push(cmd)
            } else {
              state.commands.splice(n, 1, cmd)
            }
          })
        }
      },
    },
  }
}
