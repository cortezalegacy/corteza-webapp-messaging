export default function (Messaging) {
  return {
    namespaced: true,
    state: {
      settings: [],
    },
    getters: {
      get: (state) => (key) => (state.settings.find(s => s.key === key) || {}).value,
    },
    actions: {},
    mutations: {
      set (state, { key, value }) {
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
