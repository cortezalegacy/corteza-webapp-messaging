import { User, Channel } from 'corteza-webapp-messaging/src/types'

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
        return this.$t('general.label.na')
      }

      if (c.type === 'group') {
        return this.$store.getters['channels/otherMembersOf'](c.channelID, this.$auth.user.userID)
          // Make sure user exists
          .filter(o => this.$store.getters['users/findByID'](o) !== undefined)
          .map(this.labelUser).join(', ')
      }

      return c.name || `<#${c.channelID}>`
    },

    labelUser (u) {
      if (!u) {
        console.error('Invalid user label param %o', u)
      }

      if (typeof u === 'string') {
        u = this.$store.getters['users/findByID'](u)
      }

      if (!u) {
        return this.$t('general.label.na')
      }

      return u.name || u.username || u.handle || u.email || `<@${u.userID}>`
    },

    getLabel (o) {
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
