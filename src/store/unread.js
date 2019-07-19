// A separate store to handle unread info for channels and threads
//

const types = {
  pending: 'pending',
  completed: 'completed',
  update: 'update',
  updateAPI: 'updateAPI',
}

// // Maps Message or Channel object to internal struct
// // @param {Message|Channel}
// function toInternal ({ channelID, messageID, unread } = {}) {
//   if (!unread) {
//     // Nothing to do, do not have unread info
//     return
//   }
//
//   const { count = 0, threadCount = 0, threadTotal = 0, lastMessageID = null } = unread || {}
//
//   return {
//     channelID,
//     messageID,
//
//     // number of unread messages in a channel or a single thread
//     count,
//
//     // number of unread messages in threads
//     threadCount,
//
//     // total threads with unread messages
//     threadTotal,
//
//     // ID of the last read message in the thread or channel
//     lastMessageID,
//   }
// }

function update (clean, set, input) {
  if (!input.channelID) {
    throw new Error('expecting channelID value')
  }

  // if (input.unread) {
  //   input = toInternal(input)
  // }

  if (!input.threadID) {
    delete input.threadID
  }

  const index = clean ? -1 : set.findIndex(i => (i.channelID === input.channelID) && (i.threadID === input.threadID))

  if (index < 0) {
    set.push(input)
  } else {
    set.splice(index, 1, {
      ...set[index],
      ...input,
    })
  }
}

// Accepting Channel & Message (thread) objects
function markAsRead (commit, state, payload) {
  commit(types.pending)
  state.MessagingAPI.messageMarkAsRead(payload).then((unread) => {
    commit(types.update, [{
      ...payload,
      ...unread,
    }])
  }).finally(() => {
    commit(types.completed)
  })
}

export default (MessagingAPI) => {
  return {
    namespaced: true,

    state: {
      MessagingAPI,
      pending: false,
      set: [],
    },

    getters: {
      find: (state) => ({ channelID, messageID: threadID }) => {
        return state.set.find((i) => {
          return (i.channelID === channelID) && (i.threadID === (threadID || undefined))
        }) || { count: 0, threadTotal: 0, threadCount: 0, lastMessageID: undefined }
      },

      total: (state) => state.set.reduce((sum, u) => sum + u.count + u.threadCount, 0),
    },

    actions: {
      // Accepting Channel and Message (thread) objects
      markChannelAsRead ({ commit, state }, { channelID }) {
        if (!channelID) {
          throw new Error('expecting channelID value')
        }

        markAsRead(commit, state, {
          channelID,
        })
      },

      // Accepting Channel and Message (thread) objects
      markThreadAsRead ({ commit, state }, { channelID, replyTo, messageID }) {
        const threadID = replyTo || messageID
        if (!channelID) {
          throw new Error('expecting channelID value')
        }

        markAsRead(commit, state, {
          channelID,
          threadID,
        })
      },

      // Accepting Channel & Message (thread) objects
      markChannelMessageAsRead ({ commit, state, getters }, { channelID, messageID: lastReadMessageID } = {}) {
        if (!channelID) {
          throw new Error('expecting channelID value')
        }

        if (!lastReadMessageID) {
          throw new Error('expecting messageID (lastReadMessageID) value')
        }

        markAsRead(commit, state, {
          channelID,
          lastReadMessageID,
        })
      },

      // Accepting Channel & Message (thread) objects
      markThreadMessageAsRead ({ commit, state, getters }, { channelID, replyTo: threadID, messageID: lastReadMessageID } = {}) {
        if (!channelID) {
          throw new Error('expecting channelID value')
        }

        if (!lastReadMessageID) {
          throw new Error('expecting messageID (lastReadMessageID) value')
        }

        markAsRead(commit, state, {
          channelID,
          threadID,
          lastReadMessageID,
        })
      },

      // // Sets last message ID if missing (or forced)
      // setLastMessageID ({ commit, getters }, { channelID, replyTo, messageID, force = false }) {
      //   console.log('setLastMessageID, why?', { channelID, replyTo, messageID, force })
      //   if (!messageID) {
      //     return
      //   }
      //
      //   const u = {
      //     // Set defaults
      //     count: 0,
      //     tcount: 0,
      //
      //     // Get what we know (interested mainly in lastMessageID)
      //     ...getters.find({ channelID, messageID: replyTo }),
      //
      //     // And make sure keys are properly set
      //     channelID,
      //     messageID: replyTo,
      //   }
      //
      //   if (force || !u.lastMessageID) {
      //     u.lastMessageID = messageID
      //     commit(types.update, [u])
      //   }
      // },

      fromMessage ({ commit }, { channelID, messageID: threadID, unread, deletedAt = null } = {}) {
        if (deletedAt) {
          // Remove on delete
          commit(types.remove, { channelID, threadID })
          return
        }

        if (!unread) {
          // Ignoring messages w/o unread info
          return
        }

        commit(types.update, [{
          channelID,
          threadID,
          ...unread,
        }])
      },

      fromChannel ({ commit }, { channelID, unread = undefined, deletedAt = null } = {}) {
        if (deletedAt) {
          // Remove on delete
          commit(types.remove, { channelID })
          return
        }

        if (!unread) {
          // Ignoring channels w/o unread info
          return
        }

        commit(types.update, [{
          channelID,
          ...unread,
        }])
      },

      fromEvent ({ commit }, unread) {
        commit(types.update, [unread])
      },
    },

    mutations: {
      [types.updateAPI] (state, { MessagingAPI }) {
        state.MessagingAPI = MessagingAPI
      },

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
