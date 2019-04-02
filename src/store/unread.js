import { Channel, Message } from '../types'
import i18next from 'i18next'

const types = {
  pending: 'pending',
  completed: 'completed',
  set: 'set',
  unset: 'unset',
  inc: 'inc',
  dec: 'dec',
  delta: 'delta',
}

class Unread {
  constructor (channelID, threadID, count, lastMessageID) {
    if (channelID === undefined || typeof channelID !== 'string') {
      throw new Error(i18next.t('notification.message.channelIDNotString'))
    }
    if (threadID !== undefined && typeof threadID !== 'string') {
      throw new Error(i18next.t('notification.message.threadIDNotString'))
    }

    this.channelID = channelID
    this.count = count || 0
    this.threadID = threadID || '0'
    this.lastMessageID = lastMessageID || '0'
  }
}

function filter ({ channelID, threadID = '' }) {
  return (u) => u.channelID === channelID && u.threadID === threadID
}

function transform (o) {
  if (o instanceof Channel) {
    // Channel always tranforms to channel
    return { channelID: o.ID, threadID: '0' }
  } else if (o instanceof Message) {
    if (o.replies > 0 || o.replyTo) {
      // Reply or the original (first) thread message transform to thread
      return { channelID: o.channelID, threadID: o.replyTo || o.ID }
    } else {
      // Other messages always transform to channel
      return { channelID: o.channelID, threadID: '0' }
    }
  }

  if (typeof o === 'object') {
    if (typeof o.channelID !== 'string') {
      throw new Error(i18next.t('notification.message.channelIDPropNotString'))
    }

    if (o.threadID !== undefined && typeof o.threadID !== 'string') {
      throw new Error(i18next.t('notification.message.threadIDPropNotString'))
    }

    return { channelID: o.channelID, threadID: o.threadID || '0' }
  }

  if (typeof o === 'string') {
    return { channelID: o, threadID: '0' }
  }

  throw new Error(i18next.t('notification.message.invalidUnreadParam'))
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

export default function (Messaging) {
  return {
    namespaced: true,

    state: {
      pending: false,
      set: [],
    },

    getters: {
      // Return number of unread messages in channel/thread. Default to 0
      count: (state) => (cnd) => (state.set.find(filter(transform(cnd))) || { count: 0 }).count,
      last: (state) => (cnd) => (state.set.find(filter(transform(cnd))) || { lastMessageID: '0' }).lastMessageID,
      has: (state) => (cnd) => (state.set.find(filter(transform(cnd))) || { lastMessageID: '0' }).lastMessageID !== '0',

      // All unread channels
      channels: (state) => state.set.filter(u => !u.threadID && u.count > 0),

      // Total unread count
      total: (state) => state.set.map(u => u.count).reduce((c, i) => i + c, 0),
      pending: (state) => state.pending,
    },

    actions: {
      markAsRead ({ commit }, { channelID, lastReadMessageID, threadID }) {
        commit(types.pending)
        Messaging.messageMarkAsRead({ channelID, threadID, lastReadMessageID }).then(count => {
          commit(types.set, { channelID, threadID, count, lastMessageID: lastReadMessageID })
          commit(types.completed)
        })
      },
    },

    mutations: {
      [types.pending] (state) {
        state.pending = true
      },

      [types.completed] (state) {
        state.pending = false
      },

      [types.set] (state, ...unreads) {
        for (const { channelID, threadID = '', count = 0, lastMessageID = '' } of unreads) {
          const u = new Unread(channelID, threadID, count, lastMessageID)
          const i = state.set.findIndex(filter(u))

          if (i > -1) {
            state.set.splice(i, 1, u)
          } else {
            state.set.push(u)
          }
        }
      },

      [types.unset] (state, input) {
        const i = state.set.findIndex(filter(transform(input)))
        if (i > -1) {
          state.set.splice(i, 1)
        }
      },

      [types.inc] (state, input) {
        delta(state, transform(input), 1)
      },

      [types.dec] (state, input) {
        delta(state, transform(input), -1)
      },

      [types.delta] (state, { channelID, threadID = '', delta = 0 }) {
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
    },
  }
}
