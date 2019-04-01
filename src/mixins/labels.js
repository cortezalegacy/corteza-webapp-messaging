import { User, Channel } from '@/types'

export default {
  methods: {
    labelChannel (c) {
      if (!c) {
        console.error('Invalid channel label param %o', c)
      }

      if (typeof c === 'string') {
        c = this.$store.getters['channels/findByID'](c)
      }

      if (!c) {
        console.trace('Could not load channel %o', c)
        return this.$t('general.label.na')
      }

      if (c.type === 'group') {
        const currentUser = this.$store.getters['auth/user']

        return this.$store.getters['channels/otherMembersOf'](c.ID, currentUser.ID)
          // Make sure user exists
          .filter(o => this.$store.getters['users/findByID'](o) !== undefined)
          .map(this.labelUser).join(', ')
      }

      return c.name || `<#${c.ID}>`
    },

    labelUser (u) {
      if (!u) {
        console.error('Invalid user label param %o', u)
      }

      if (typeof u === 'string') {
        u = this.$store.getters['users/findByID'](u)
      }

      if (!u) {
        console.trace('Could not load user %o', u)
        return this.$t('general.label.na')
      }

      return u.name || u.username || u.handle || u.email || `<@${u.ID}>`
    },

    label (o) {
      if (o instanceof User) {
        return this.labelUser(o)
      }

      if (o instanceof Channel) {
        return this.labelChannel(o)
      }

      return o
    },
  },
}
