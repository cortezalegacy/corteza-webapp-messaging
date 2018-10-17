// initial state
const state = {
  channels: [],
  ignoreChannel: null,
}

function Unread (ID, count, ignore) {
  this.ID = ID
  this.count = count || 0
}

// getters
const getters = {
  channel: (state) => (ID) => (state.channels.find(u => u.ID === ID) || new Unread(ID)).count,
  isChannelIgnored: (state) => (ID) => state.ignoreChannel === ID,
}

// actions
const actions = {
  setChannel ({ commit, getters }, { ID, count }) {
    if (!getters.isChannelIgnored(ID) || count === 0) {
      commit('setChannel', new Unread(ID, count))
    }
  },

  incChannel ({ commit, getters }, ID) {
    if (!getters.isChannelIgnored(ID)) {
      commit('setChannel', new Unread(ID, getters.channel(ID) + 1))
    }
  },

  ignoreChannel ({ commit, getters }, ID) {
    if (!getters.isChannelIgnored(ID)) {
      commit('setIgnoreChannel', ID)
    }
  },

  unignoreChannel ({ commit, getters }, ID) {
    if (getters.isChannelIgnored(ID)) {
      commit('setIgnoreChannel', null)
    }
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

  setIgnoreChannel (state, ID) {
    state.ignoreChannel = ID
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
