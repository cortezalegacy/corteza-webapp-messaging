import { User } from 'corteza-webapp-messaging/src/types'

const types = {
  pending: 'pending',
  completed: 'completed',
  updateList: 'updateList',
  updateActivity: 'updateActivity',

  // status related
  statusSet: 'statusSet',
  statusRemove: 'statusRemove',
  statusCleanup: 'statusCleanup',

  active: 'active',
  inactive: 'inactive',
  cleanup: 'cleanup',
  updateAPI: 'updateAPI',
}

// How much time (in seconds) should we keep the activity
const activityTTL = 5000
const statusTTL = 35000

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
    return now - ttl > this.updatedAt
  }

  update () {
    this.updatedAt = (new Date()).getTime()
    return this
  }
}

class Status {
  constructor ({ permanent = true, icon, message, present, userID } = {}) {
    this.permanent = permanent
    this.icon = icon
    this.message = message
    this.present = present
    this.userID = userID

    this.createdAt = (new Date()).getTime()
    this.update()
  }

  // ttl contains ttl based on status type
  isStale (ttl = {}) {
    if (this.permanent) {
      return false
    }

    const now = (new Date()).getTime()
    let use = ttl[this.present] || statusTTL
    return now - use > this.updatedAt
  }

  update () {
    this.updatedAt = (new Date()).getTime()
    return this
  }

  // uses bitwise xor to invert result on demand
  static finder ({ userID, present }, invert = false) {
    return (s) => !!((s.userID === userID && s.present === present) ^ invert)
  }
}

export default function (MessagingAPI, SystemAPI) {
  return {
    namespaced: true,
    state: {
      MessagingAPI,
      SystemAPI,
      pending: false,
      list: [],

      // Keeps user presence & channel activity
      activity: [], // []Activity
      status: [],
    },
    getters: {
      list: (state) => state.list,
      statuses: (state) => state.status,
      listOnDemand: (state) => () => state.list,
      length: (state) => state.list.length,
      findByID: (state) => (ID) => state.list.find(u => ID === u.userID),
      findByUsername: (state) => (username) => {
        return state.list.filter(user => user.username === username)[0] || undefined
      },
      pending: (state) => state.pending,

      isPresent:
        (state) =>
          (userID) => {
            return state.status.findIndex((s) => s.userID === userID) >= 0
          },

      channelActivity:
        (state) =>
          (channelID, kind) => {
            const IDs = state.activity.filter(a => a.channelID === channelID && a.kind === kind).map(a => a.userID)
            return state.list.filter(u => IDs.includes(u.userID))
          },
    },
    actions: {
      async load ({ commit, state }) {
        commit(types.pending)
        state.SystemAPI.userList().then(({ set }) => {
          commit(types.updateList, set)
          commit(types.completed)
        })
      },

      async loadStatuses ({ commit, state }) {
        commit(types.pending)
        state.MessagingAPI.statusList().then((statuses) => {
          commit(types.statusSet, statuses)
          commit(types.completed)
        })
      },
    },
    mutations: {
      [types.updateAPI] (state, { MessagingAPI, SystemAPI }) {
        state.MessagingAPI = MessagingAPI
        state.SystemAPI = SystemAPI
      },

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
            const n = state.list.findIndex(u => u.userID === usr.userID)

            // Doesn't yet exist -- add it
            if (n < 0) {
              state.list.push(usr)
            } else {
              state.list.splice(n, 1, usr)
            }
          })
        }
      },

      [types.active] (state, activities) {
        for (const activity of activities) {
          const i = state.activity.findIndex(activityFinder(activity))
          if (i > -1) {
            state.activity.splice(i, 1, state.activity[i].update())
          } else {
            state.activity.push(new Activity(activity))
          }
        }
      },

      [types.inactive] (state, { userID, channelID, kind }) {
        state.activity = [...state.activity.filter((a) =>
          !(a.userID === userID && a.channelID === channelID && a.kind === kind))]
      },

      // Removes all stale activity
      [types.cleanup] (state, { ttl }) {
        state.activity = state.activity.filter(a => !a.isStale(ttl))
      },

      [types.statusSet] (state, statuses) {
        for (const status of statuses) {
          const i = state.status.findIndex(Status.finder(status))
          if (i > -1) {
            state.status.splice(i, 1, state.status[i].update())
          } else {
            state.status.push(new Status(status))
          }
        }
      },

      [types.statusRemove] (state, statuses) {
        for (const status of statuses) {
          state.status = state.status.filter(Status.finder(status, true))
        }
      },

      [types.statusCleanup] (state, { ttl }) {
        state.status = state.status.filter(s => !s.isStale(ttl))
      },
    },
  }
}
