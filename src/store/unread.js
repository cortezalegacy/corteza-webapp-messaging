// initial state
const state = {
  channels: [],
}

function Unread (ID, count) {
  this.ID = ID
  this.count = count || 0
}

// getters
const getters = {
  channel: (state) => (ID) => (state.channels.find(u => u.ID === ID) || new Unread(ID)).count,
}

// actions
const actions = {
  setChannel ({ commit }, { ID, count }) {
    commit('setChannel', new Unread(ID, count))
  },

  incChannel ({ commit, getters }, ID) {
    commit('setChannel', new Unread(ID, getters.channel(ID) + 1))
  },
}

// mutations
const mutations = {
  setChannel (state, unread) {
    const i = state.channels.findIndex(u => u.ID === unread.ID)

    if (i > -1) {
      state.channels.splice(i, 1, unread)
    } else {
      state.channels.push(unread)
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
