// initial state
const state = {
  settings: [],
}

// getters
const getters = {
  get: (state) => (key) => (state.settings.find(s => s.key === key) || {}).value,
}

// actions
const actions = {}

// mutations
const mutations = {
  set (state, { key, value }) {
    const i = state.settings.findIndex(s => s.key === key)

    if (i > -1) {
      state.settings.splice(i, 1, { key, value })
    } else {
      state.settings.push({ key, value })
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
