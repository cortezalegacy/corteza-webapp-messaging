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

  // Return all but deleted
  list: (state) => state.list.filter(c => !c.deletedAt && !c.archivedAt),

  // Return private & public channels
  listChannels: (state, getters) => getters.list.filter(c => c.type === 'private' || c.type === 'public'),

  // Return groups
  listGroups: (state, getters) => getters.list.filter(c => c.type === 'group'),

  // Find channel by name
  findByName: (state, getters) => (name) => {
    return getters.list.filter(c => c.name === name)[0] || undefined
  },

  // Find channel by
  findByID: (state, getters) => (ID) => {
    return getters.list.filter(c => c.ID === ID)[0] || undefined
  },

  otherMembersOf: (state, getters) => (channelID, userID) => {
    const ch = getters.findByID(channelID)

    if (!ch) {
      return []
    }

    if (ch.members.length === 1) {
      return ch.members
    }

    return ch.members.filter(memberID => memberID !== userID)
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

  join ({ commit, getters }, { channelID, memberID }) {
    const ch = getters.findByID(channelID)
    if (ch) {
      if (ch.members.findIndex(m => m === memberID) > -1) {
        ch.members.push(memberID)
        commit('updateList', ch)
      }
    }
  },

  part ({ commit }, { channelID, memberID }) {
    const ch = getters.findByID(channelID)
    if (ch) {
      const i = ch.members.findIndex(m => m === memberID)
      if (i > -1) {
        ch.members.splice(i, 1)
        commit('updateList', ch)
      }
    }
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
