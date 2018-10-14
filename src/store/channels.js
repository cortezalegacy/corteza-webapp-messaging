// initial state
const state = {
  current: null,
  list: [],
  lastMessages: [], // set of channelID-messageId pairs
}

// getters
const getters = {
  // Finds last message id for a specific channel
  lastMessage: (state) => (channelID) => {
    const ci = state.lastMessages.findIndex(lm => lm.channelID === channelID)
    return ci < 0 ? 0 : state.lastMessages[ci].messageId
  },
  current: (state) => state.list.find(ch => ch.ID === state.current),
  list: (state) => state.list,
  listChannels: (state) => state.list.filter(c => c.type === 'private' || c.type === 'public'),
  listGroups: (state) => state.list.filter(c => c.type === 'group'),
  findByName: (state) => (name) => {
    return state.list.filter(c => c.name === name)[0] || undefined
  },
  findByID: (state) => (ID) => {
    return state.list.filter(c => c.ID === ID)[0] || undefined
  },
}

// actions
const actions = {
  setCurrentById ({ commit }, channelID) {
    commit('setCurrent', channelID)
  },

  resetList ({ commit }, list) {
    commit('resetList', list)
  },

  updateList ({ commit }, channel) {
    commit('updateList', channel)
  },

  removeFromList ({ commit }, channel) {
    commit('removeFromList', channel)
  },

  incUnreadMessageCount ({ commit, getters }, channelID) {
    const ch = getters.findByID(channelID)

    if (ch) {
      ch.view.newMessagesCount++
      commit('updateList', ch)
    }
  },

  resetUnreadMessageCount ({ commit, getters }, channelID) {
    const ch = getters.findByID(channelID)

    if (ch) {
      ch.view.newMessagesCount = 0
      commit('updateList', ch)
    }
  },
}

// mutations
const mutations = {
  setCurrent (state, channelID) {
    state.current = channelID
  },

  resetList (state, channels) {
    state.list = channels
  },

  updateList (state, channel) {
    const l = state.list
    const i = l.findIndex(c => c.ID === channel.ID)

    if (i === -1) {
      l.unshift(channel)
    } else {
      l[i] = channel
    }

    state.list = [...l]
  },

  removeFromList (state, channel) {
    state.list = [...state.list.filter(ch => channel.ID !== ch.ID)]
  },

  updateLastMessage (state, { channelID, messageId }) {
    const ci = state.lastMessages.findIndex(lm => lm.channelID === channelID)
    if (ci < 0) {
      state.lastMessages.push({ channelID, messageId })
    } else {
      state.lastMessages.splice(ci, 1, { channelID, messageId })
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
