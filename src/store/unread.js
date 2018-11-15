// initial state
import { Channel, Message } from '../types'

const state = {
  set: [],
  // ignoreChannel: null,
}

class Unread {
  constructor (channelID, threadID, count, lastMessageID) {
    if (channelID === undefined || typeof channelID !== 'string') {
      throw new Error('Expecting channelID param to be string')
    }
    if (threadID !== undefined && typeof threadID !== 'string') {
      throw new Error('Expecting threadID param to be string')
    }

    this.channelID = channelID
    this.count = count || 0
    this.threadID = threadID || ''
    this.lastMessageID = lastMessageID || ''
  }
}

function filter ({ channelID, threadID = '' }) {
  return (u) => u.channelID === channelID && u.threadID === threadID
}

function transform (o) {
  if (o instanceof Channel) {
    return { channelID: o.ID, threadID: '' }
  } else if (o instanceof Message) {
    return { channelID: o.channelID, threadID: o.replyTo || '' }
  }

  if (typeof o === 'object') {
    if (typeof o.channelID !== 'string') {
      throw new Error('Expecting channelID property to be string')
    }

    if (o.threadID !== undefined && typeof o.threadID !== 'string') {
      throw new Error('Expecting threadID property to be string')
    }

    return { channelID: o.channelID, threadID: o.threadID || '' }
  }

  if (typeof o === 'string') {
    return { channelID: o, threadID: '' }
  }

  throw new Error('Expecting input params for unread to be string, ' +
    'Channel, Message or object containing channelID property')
}

function delta (state, { channelID, threadID = '' }, delta = 0) {
  const i = state.set.findIndex(filter({ channelID, threadID }))
  if (i > -1) {
    const u = state.set[i]
    u.count += delta

    if (u.count >= 0) {
      state.set.splice(i, 1, u)
    }
  } else if (delta > 0) {
    state.set.push(new Unread(channelID, threadID, delta))
  }
}

// getters
const getters = {
  // hasUnread: (state) => (cnd) => (state.set.find(filter(cnd)) || {}).lastMessageID !== lastMessageID

  // Return number of unread messages in channel/thread. Default to 0
  count: (state) => (cnd) => (state.set.find(filter(transform(cnd))) || { count: 0 }).count,
  last: (state) => (cnd) => (state.set.find(filter(transform(cnd))) || { count: 0 }).lastMessageID,

  // All unread channels
  channels: (state) => state.set.filter(u => !u.threadID),

  // channels: (state) => state.channels.filter(c => c.count > 0),
  // channel: (state) => (ID) => (state.channels.find(u => u.ID === ID) || new Unread(ID)).count,
  // lastMessageInChannel: (state) => (ID) => (state.channels.find(u => u.ID === ID) || new Unread(ID)).lastMessageID,
  // isChannelIgnored: (state) => (ID) => state.ignoreChannel === ID,
}

// actions
const actions = {/*
  setChannel ({ commit, getters }, { ID, count, lastMessageID }) {
    if (!getters.isChannelIgnored(ID) || count === 0) {
      commit('setChannel', new Unread(ID, count, lastMessageID))
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
*/}

// mutations
const mutations = {
  set (state, { channelID, threadID = '', count = 0, lastMessageID = '' }) {
    const u = new Unread(channelID, threadID, count, lastMessageID)
    const i = state.set.findIndex(filter(u))

    if (i > -1) {
      state.set.splice(i, 1, u)
    } else {
      state.set.push(u)
    }
  },

  unset (state, input) {
    const i = state.set.findIndex(filter(transform(input)))
    if (i > -1) {
      state.set.splice(i, 1)
    }
  },

  inc (state, input) {
    delta(state, transform(input), 1)
  },

  dec (state, input) {
    delta(state, transform(input), -1)
  },

  delta (state, { channelID, threadID = '', delta = 0 }) {
    const i = state.set.findIndex(filter({ channelID, threadID }))
    if (i > -1) {
      const u = state.set[i]
      u.count += delta
      state.set.splice(i, 1, u)
    }
  },
  //
  // setIgnoreChannel (state, ID) {
  //   state.ignoreChannel = ID
  // },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
