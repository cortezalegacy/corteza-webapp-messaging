const types = {
  pending: 'pending',
  completed: 'completed',
  set: 'set',
}

export default function (MessagingAPI) {
  return {
    namespaced: true,
    state: {
      settings: [],
      pending: false,
    },
    getters: {
      get: (state) => (key) => (state.settings.find(s => s.key === key) || {}).value,
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

      [types.set] (state, { key, value }) {
        const i = state.settings.findIndex(s => s.key === key)

        if (i > -1) {
          state.settings.splice(i, 1, { key, value })
        } else {
          state.settings.push({ key, value })
        }
      },
    },
  }
}
