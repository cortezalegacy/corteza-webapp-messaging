import { Channel, Message } from '@/types'

export default {
  install (Vue, { eventbus, store }) {
    eventbus.$on('$ws.channels', (channels) => {
      let cc = []
      channels.forEach((c) => {
        cc.push(new Channel(c))

        // Set unread state for all channels
        store.dispatch('unread/setChannel', { ID: c.ID, count: (c.view || {}).newMessagesCount })
      })

      store.dispatch('channels/resetList', cc)
    })

    eventbus.$on('$ws.channel', (channel) => {
      store.dispatch('channels/updateList', new Channel(channel))
    })

    eventbus.$on('$ws.channelJoin', (join) => {
      store.dispatch('channels/joinChannel', join)
    })

    eventbus.$on('$ws.channelPart', (part) => {
      store.dispatch('channels/partChannel', part)
    })

    eventbus.$on('$ws.channelActivity', (activity) => {
      console.log('activity', activity)
    })

    // Handle users payload when it gets back
    eventbus.$on('$ws.users', (users) => {
      store.dispatch('users/resetList', users)
    })

    eventbus.$on('$ws.clientConnected', ({ uid }) => {
      store.dispatch('users/connected', uid)
    })

    eventbus.$on('$ws.clientDisconnected', ({ uid }) => {
      store.dispatch('users/disconnected', uid)
    })

    // Handles single-message updates that gets from the backend
    eventbus.$on('$ws.message', (message) => {
      const msg = new Message(message)
      store.dispatch('unread/incChannel', msg.channelID)
      store.dispatch('history/update', [msg])

      // @fixme needs additional attention and testing
      // if (!currentUser && (!currentChannel || !this.hasFocus)) {
      //   // Not in our current channel
      //   // @todo need to check if window has focus as well
      //   this.$notification.show(`New message in ${this.ch.name} | Crust`, {
      //     body: msg.message.length > 200 ? msg.message.substring(0, 200) + '...' : msg.message,
      //   }, {})
      // }
    })

    // This serves a sole purpose of handling callback to getMessage calls to $ws
    eventbus.$on('$ws.messages', messages => store.dispatch('history/update', messages.map(message => new Message(message))))

    eventbus.$on('$ws.commands', (commands) => {
      store.dispatch('suggestions/setCommands', commands)
    })
  },
}
