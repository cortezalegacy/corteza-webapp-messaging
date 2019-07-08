
const types = {
  pending: 'pending',
  completed: 'completed',
  updatePermissions: 'updatePermissions',
}

const findPermission = (state, operation) => {
  return (state.permissions.find(s => s.operation === operation) || {}).allow
}

export default function (Messaging) {
  return {
    namespaced: true,
    state: {
      permissions: [],
      pending: false,
    },
    getters: {
      pending: (state) => state.pending,
      canAccess: (state) => (findPermission(state, 'access')),
      canGrant: (state) => (findPermission(state, 'grant')),
      canCreateGroupChannel: (state) => (findPermission(state, 'channel.group.create')),
      canCreatePublicChannel: (state) => (findPermission(state, 'channel.public.create')),
      canCreatePrivateChannel: (state) => (findPermission(state, 'channel.private.create')),
    },
    actions: {
      async load ({ commit }) {
        commit(types.pending)
        Messaging.permissionsEffective().then((permissions) => {
          commit(types.updatePermissions, permissions)
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

      [types.updatePermissions] (state, permissions) {
        if (state.permissions.length === 0) {
          state.permissions = permissions
        } else {
          permissions.forEach(per => {
            // Replaces given cmd due to an update
            const n = state.permissions.findIndex(p => p.operation === per.operation)

            // Doesn't yet exist -- add it
            if (n < 0) {
              state.permissions.push(per)
            } else {
              state.permissions.splice(n, 1, per)
            }
          })
        }
      },
    },
  }
}
