// initial state
const state = {
  list: [],

  // Keeps user presence & channel activity
  activity: [], // []Activity
}

const activityFinder = ({ userID, channelID, kind }) =>
  (a) => a.userID === userID && a.channelID === channelID && a.kind === kind

class Activity {
  constructor (props = {}) {
    Object.assign(this, props)
    this.createdAt = (new Date()).getTime()
    this.update()
  }

  validate (window = 60) {
    const now = (new Date()).getTime()
    return now > this.updatedAt - window
  }

  update () {
    this.updatedAt = (new Date()).getTime()
    return this
  }
}

// getters
const getters = {
  list: (state) => state.list,
  listOnDemand: (state) => () => state.list,
  length: (state) => state.list.length,
  findByID: (state) => (ID) => state.list.find(u => ID === u.ID),
  findByUsername: (state) => (username) => {
    return state.list.filter(user => user.username === username)[0] || undefined
  },

  isPresent:
    (state) =>
      (ID) =>
        (state.list.find(a => a.ID === ID) || {}).connections > 0,

  activeInChannel:
    (state) =>
      (channelID, kind) => {
        const IDs = state.activity.filter(a => a.channelID === channelID && a.kind === kind).map(a => a.userID)
        return state.list.filter(u => IDs.includes(u.ID))
      },

}
// actions
const actions = {
  resetList ({ commit }, list) {
    commit('resetList', list)
  },
}

// mutations
const mutations = {
  resetList (state, users) {
    state.list = users
  },

  connections (state, { ID, delta = undefined, value = undefined }) {
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

  active (state, props) {
    const i = state.activity.findIndex(activityFinder(props))
    if (i > -1) {
      state.activity.splice(i, 1, state.activity[i].update())
    } else {
      state.activity.push(new Activity(props))
    }
  },

  // Removes all activities that match
  //
  // note: if you pass undefined channel it purges all user's activity (presence)
  //       if you pass undefined kind, it purges all user's channel activity
  inactive (state, { userID, channelID, kind }) {
    state.activity = [...state.activity.filter((a) =>
      !(a.userID === userID && a.channelID === channelID && a.kind === kind))]
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}
