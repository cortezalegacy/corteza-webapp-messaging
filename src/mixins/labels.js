import { User, Channel } from 'corteza-webapp-messaging/src/types'

export default {
  methods: {
    labelChannel (c, users = {}) {
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
          .filter(userID => users[userID] !== undefined)
          .map(userID => users[userID].label)
          .join(', ')
      }

      return c.name || `<#${c.channelID}>`
    },

    getLabel (o) {
      if (o instanceof User) {
        // For legacy reasons; should be removed at some point
        return o.label
      }

      if (o instanceof Channel) {
        return this.labelChannel(o)
      }

      return o
    },
  },
}
