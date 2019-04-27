export default function (Messaging) {
  return {
    namespaced: true,
    state: {
      current: null,
      list: [],
      lastMessages: [], // set of channelID-messageId pairs
    },
    getters: {
      // Finds last message id for a specific channel
      lastMessage: (state) => (channelID) => {
        const ci = state.lastMessages.findIndex(lm => lm.channelID === channelID)
        return ci < 0 ? 0 : state.lastMessages[ci].messageId
      },
      current: (state) => state.current,

      // Return all but deleted
      list: (state) => state.list.filter(c => c.canJoin || c.canObserve),
      listOnDemand: (state) => () => state.list.filter(c => !c.deletedAt && !c.archivedAt),

      // Return private & public channels
      byType: (state, getters) => (type) => getters.list.filter(c => c.type === type),

      // Find channel by ID
      findByID: (state, getters) => (ID) => {
        return getters.list.filter(c => c.ID === ID)[0] || undefined
      },

      // Find direct/group channel for a specific set of members
      findByMembership: (state, getters) => (...userIDs) => {
        const userCount = userIDs.length
        const uidstr = JSON.stringify(userIDs.sort())
        const eq = (members) => JSON.stringify([...members].sort()) === uidstr

        return getters.list.find(c => c.type === 'group' && c.members.length === userCount && eq(c.members))
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
    },
    actions: {
      setCurrent ({ commit }, channel) {
        commit('setCurrent', channel)
      },

      resetList ({ commit }, list) {
        commit('resetList', list)
      },

      updateList ({ commit }, channel) {
        commit('updateList', channel)
      },

      join ({ commit, getters }, { channelID, userID }) {
        const ch = getters.findByID(channelID)
        if (ch) {
          if (ch.members.findIndex(m => m === userID) > -1) {
            ch.members.push(userID)
            commit('updateList', ch)
          }
        }
      },

      part ({ commit, getters }, { channelID, userID }) {
        const ch = getters.findByID(channelID)

        if (ch) {
          if (ch.type === 'public') {
            // Keep public channels in the list
            const i = ch.members.findIndex(m => m === userID)
            if (i > -1) {
              ch.members.splice(i, 1)
              commit('updateList', ch)
            }
          } else {
            // Remove non-public channels, groups from the list
            commit('removeFromList', ch)
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
    },
    mutations: {
      setCurrent (state, channel) {
        state.current = channel
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
    },
  }
}
