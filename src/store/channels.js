import { Channel } from 'corteza-webapp-messaging/src/types'

const types = {
  pending: 'pending',
  completed: 'completed',
  resetList: 'resetList',
  updateList: 'updateList',
  channelJoin: 'channelJoin',
  channelPart: 'channelPart',
  removeFromList: 'removeFromList',
}

export default function (MessagingAPI) {
  return {
    namespaced: true,

    state: {
      pending: false,
      list: [],
    },

    getters: {
      pending: (state) => state.pending,

      // Return all but deleted
      list: (state) => state.list.filter(c => c.canJoin || c.canObserve),
      listOnDemand: (state) => () => state.list.filter(c => !c.deletedAt && !c.archivedAt),

      // Return private & public channels
      byType: (state, getters) => (type) => getters.list.filter(c => c.type === type),

      // Find channel by ID
      findByID: (state, getters) => (ID) => {
        return getters.list.filter(c => c.channelID === ID)[0] || undefined
      },

      // Find channels where user is member; can skip flagged channels
      findWhereMember: (state, getters) => (userID, ignoreFlagged = false) => {
        return getters.list.filter(({ members, membershipFlag }) => members.includes(userID) && (!ignoreFlagged || (membershipFlag !== 'ignored' && membershipFlag !== 'hidden')))
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
      // Loads & transforms all channels
      async load ({ commit, state }) {
        commit(types.pending)
        return new Promise((resolve) => {
          MessagingAPI.channelList().then((cc) => {
            cc = cc.map(c => new Channel(c))
            commit(types.resetList, cc)
            resolve(cc)
          }).finally(() => {
            commit(types.completed)
          })
        })
      },

      setMembershipFlag ({ commit, state }, { channelID, flag }) {
        commit(types.pending)
        MessagingAPI.channelSetFlag({ channelID, flag }).then((ch) => {
          commit(types.updateList, new Channel(ch))
        }).finally(() => {
          commit(types.completed)
        })
      },

      removeMembershipFlag ({ commit, state }, { channelID }) {
        commit(types.pending)
        MessagingAPI.channelRemoveFlag({ channelID }).then((ch) => {
          commit(types.updateList, new Channel(ch))
        }).finally(() => {
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

      [types.resetList] (state, channels) {
        state.list = channels
      },

      [types.updateList] (state, channel) {
        const l = state.list
        const i = l.findIndex(c => c.channelID === channel.channelID)

        if (i === -1) {
          l.unshift(channel)
        } else {
          l[i] = channel
        }

        state.list = [...l]
      },

      [types.channelJoin] (state, { channelID, userID }) {
        const ch = state.list.findIndex(c => c.channelID === channelID)

        if (ch >= 0) {
          const channel = state.list[ch]
          if (channel.members.findIndex(m => m === userID) < 0) {
            channel.members.push(userID)
            state.list.splice(ch, 1, channel)
          }
        }
      },

      [types.channelPart] (state, { channelID, userID }) {
        const ch = state.list.findIndex(c => c.channelID === channelID)

        if (ch >= 0) {
          const channel = state.list[ch]
          const i = channel.members.findIndex(m => m === userID)
          if (i > -1) {
            channel.members.splice(i, 1)
            state.list.splice(ch, 1, channel)
          }

          // Remove non-public channels, groups from the list
          if (channel.type !== 'public') {
            state.list.splice(ch, 1)
          }
        }
      },

      [types.removeFromList] (state, { ID }) {
        state.list = [...state.list.filter(ch => ID !== ch.channelID)]
      },
    },
  }
}
