import { User } from '@/types'

const types = {
  pending: 'pending',
  completed: 'completed',
  updateList: 'updateList',
  updateActivity: 'updateActivity',

  active: 'active',
  inactive: 'inactive',
  cleanup: 'cleanup',
}

// How much time (in seconds) should we keep the activity
const activityTTL = 5000
const onlineTTL = 20000

const activityFinder = ({ userID, channelID, kind }) =>
  (a) => a.userID === userID && a.channelID === channelID && a.kind === kind

class Activity {
  constructor (props = {}) {
    Object.assign(this, props)
    this.createdAt = (new Date()).getTime()
    this.update()
  }

  isStale (ttl = activityTTL, onlineTtl = onlineTTL) {
    const now = (new Date()).getTime()
    let use = ttl

    // Online activity should last longer
    if (this.kind === 'online') {
      use = onlineTtl
    }
    return now - use > this.updatedAt
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
          (userID) => {
            return state.activity.findIndex((a) => a.userID === userID) >= 0
          },

      channelActivity:
        (state) =>
          (channelID, kind) => {
            const IDs = state.activity.filter(a => a.channelID === channelID && a.kind === kind).map(a => a.userID)
            return state.list.filter(u => IDs.includes(u.ID))
          },
    },
    actions: {
      async load ({ commit }) {
        commit(types.pending)
        System.userList().then((users) => {
          commit(types.updateList, users)
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

      [types.updateList] (state, users) {
        users = users.map(u => { return new User(u) })
        if (state.list.length === 0) {
          state.list = users
        } else {
          users.forEach(usr => {
            // Replaces given user due to an update
            const n = state.list.findIndex(u => u.ID === usr.ID)

            // Doesn't yet exist -- add it
            if (n < 0) {
              state.list.push(usr)
            } else {
              state.list.splice(n, 1, usr)
            }
          })
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

      [types.inactive] (state, { userID, channelID, kind }) {
        state.activity = [...state.activity.filter((a) =>
          !(a.userID === userID && a.channelID === channelID && a.kind === kind))]
      },

      // Removes all stale activity
      [types.cleanup] (state, { ttl, onlineTtl }) {
        state.activity = state.activity.filter(a => !a.isStale(ttl, onlineTtl))
      },
    },
  }
}
