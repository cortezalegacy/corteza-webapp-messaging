// A separate store to handle unread info for channels and threads
//

const types = {
  pending: 'pending',
  completed: 'completed',
  update: 'update',
}

// Maps Message or Channel object to internal struct
// @param {Message|Channel}
function toInternal ({ channelID, messageID, unread } = {}) {
  if (!unread) {
    // Nothing to do, do not have unread info
    return
  }

  const { count = 0, tcount = 0, lastMessageID = null } = unread || {}

  return {
    channelID,
    messageID,

    // number of unread messages in a channel or a single thread
    count,

    // number of unread messages in threads
    tcount,

    // ID of the last read message in the thread or channel
    lastMessageID,
  }
}

function update (clean, set, { channelID, messageID = '', count, tcount, delta, lastMessageID = null }) {
  if (!channelID) {
    throw new Error('expecting channelID value')
  }

  let index = -1

  if (!clean) {
    index = set.findIndex(i => (i.channelID === channelID) && (i.messageID === (messageID || '')))
  }

  if (index > -1 && !lastMessageID) {
    lastMessageID = set[index].lastMessageID
  }

  let item = {
    channelID,
    messageID,
    lastMessageID,
    count,
    tcount,
  }

  if (delta) {
    // Increment count of an existing value
    item.count = index < 0 ? delta : (set[index].count + delta)
  }

  if (index < 0) {
    set.push(item)
  } else {
    set.splice(index, 1, item)
  }

  if (messageID && delta) {
    // this is thread message,
    // update tcount on the channel when delta is positive
    index = set.findIndex(i => (i.channelID === channelID) && !i.messageID)

    if (index < 0) {
      // new entry
      set.push({
        channelID,
        count: 0,
        tcount: delta,
      })
    } else {
      // existing entry, modify tcount with delta
      let item = { ...set[index] }
      item.tcount = item.tcount ? item.tcount + delta : delta
      set.splice(index, 1, item)
    }
  }
}

export default (MessagingAPI) => {
  return {
    namespaced: true,

    state: {
      pending: false,
      set: [],
    },

    getters: {
      find: (state) => ({ channelID, messageID = '' }) => {
        return state.set.find((i) => {
          return (i.channelID === channelID) && ((i.messageID || '') === (messageID || ''))
        }) || {}
      },
    },

    actions: {
      clear ({ commit, getters }, { channelID, messageID }) {
        commit(types.pending)
        MessagingAPI.messageMarkAsRead({ channelID, threadID: messageID }).then((unread) => {
          commit(types.update, [toInternal({
            channelID,
            messageID,
            unread,
          })])
        }).finally(() => {
          commit(types.completed)
        })
      },

      mark ({ commit, getters }, { channelID, replyTo, messageID }) {
        commit(types.pending)
        MessagingAPI.messageMarkAsRead({ channelID, threadID: replyTo, lastReadMessageID: messageID }).then((unread) => {
          commit(types.update, [toInternal({
            channelID,
            messageID: replyTo,
            unread,
          })])
        }).finally(() => {
          commit(types.completed)
        })
      },

      // Sets last message ID if missing (or forced)
      setLastMessageID ({ commit, getters }, { channelID, replyTo, messageID, force = false }) {
        if (!messageID) {
          return
        }

        const u = {
          // Set defaults
          count: 0,
          tcount: 0,

          // Get what we know (interested mainly in lastMessageID)
          ...getters.find({ channelID, messageID: replyTo }),

          // And make sure keys are properly set
          channelID,
          messageID: replyTo,
        }

        if (force || !u.lastMessageID) {
          u.lastMessageID = messageID
          commit(types.update, [u])
        }
      },

      // Updates internal unread counter (increment or decrement, depending on deletedAt status)
      //
      // @param {Message}
      count ({ commit }, { channelID, replyTo = '', updatedAt = null, deletedAt = null }) {
        if (updatedAt) {
          // Ignoring updated messages
          return
        }

        const payload = {
          // Always use channelID
          channelID,

          // Remap value of replyTo to messageID to trigger thread counter
          messageID: replyTo,

          // Decrement or increment? depending on deletedAt info
          delta: deletedAt ? -1 : 1,
        }

        commit(types.update, [payload])
      },

      // Updates unread info holder
      //
      // @param {Message|Channel|[Message|Channel]} Item
      update ({ commit }, set) {
        if (!Array.isArray(set)) {
          set = [set]
        }

        commit(types.update, set.map(i => toInternal(i)).filter(i => !!i))
      },
    },

    mutations: {
      [types.pending] (state) {
        state.pending = true
      },

      [types.completed] (state) {
        state.pending = false
      },

      [types.update] (state, set) {
        const clean = (state.set.length === 0)
        set.forEach(i => update(clean, state.set, i))
      },
    },
  }
}
