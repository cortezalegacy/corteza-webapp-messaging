import { User } from '@/types'

const types = {
  pending: 'pending',
  completed: 'completed',
  resetList: 'resetList',
  connections: 'connections',

  active: 'active',
  inactive: 'inactive',
  cleanup: 'cleanup',
}

// How much time (in seconds) should we keep the activity
const activityTTL = 5

const activityFinder = ({ userID, channelID, kind }) =>
  (a) => a.userID === userID && a.channelID === channelID && a.kind === kind

class Activity {
  constructor (props = {}) {
    Object.assign(this, props)
    this.createdAt = (new Date()).getTime()
    this.update()
  }

  isStale (ttl = activityTTL) {
    const now = (new Date()).getTime()
    return now - (ttl * 1000) > this.updatedAt
  }

  update () {
    this.updatedAt = (new Date()).getTime()
    return this
  }
}

export default function (Messaging, System) {
  return {
    namespaced: true,
    state: {
      pending: false,
      list: [],

      // Keeps user presence & channel activity
      activity: [], // []Activity
    },
    getters: {
      list: (state) => state.list,
      listOnDemand: (state) => () => state.list,
      length: (state) => state.list.length,
      findByID: (state) => (ID) => state.list.find(u => ID === u.ID),
      findByUsername: (state) => (username) => {
        return state.list.filter(user => user.username === username)[0] || undefined
      },
      pending: (state) => state.pending,

      isPresent:
        (state) =>
          (ID) =>
            (state.list.find(a => a.ID === ID) || {}).connections > 0,

      channelActivity:
        (state) =>
          (channelID, kind) => {
            const IDs = state.activity.filter(a => a.channelID === channelID && a.kind === kind).map(a => a.userID)
            return state.list.filter(u => IDs.includes(u.ID))
          },
    },
    actions: {
      async load  ({ commit }) {
        commit(types.pending)
        System.userList().then((users) => {
          commit(types.resetList, users.map(u => new User(u)))
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

      [types.resetList] (state, users) {
        state.list = users
      },

      [types.connections] (state, { ID, delta = undefined, value = undefined }) {
        const i = state.list.findIndex(u => u.ID === ID)
        if (i > -1) {
          const user = state.list[i]
          if (value !== undefined) {
            user.connections = value
          } else if (delta !== undefined) {
            user.connections += delta

            if (user.connections < 0) {
              user.connections = 0
            }
          } else {
            return
          }

          state.list.splice(i, 1, user)
        }
      },

      [types.active] (state, props) {
        const i = state.activity.findIndex(activityFinder(props))
        if (i > -1) {
          state.activity.splice(i, 1, state.activity[i].update())
        } else {
          state.activity.push(new Activity(props))
        }
      },

      // Removes all activities that match
      [types.inactive] (state, { userID, channelID, kind }) {
        state.activity = [...state.activity.filter((a) =>
          !(a.userID === userID && a.channelID === channelID && a.kind === kind))]
      },

      // Removes all stale activity
      [types.cleanup] (state, { ttl }) {
        state.activity = state.activity.filter(a => a.isStale(ttl))
      },
    },
  }
}
