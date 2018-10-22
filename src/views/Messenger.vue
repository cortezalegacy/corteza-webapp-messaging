<template>
    <main>
        <!-- if no channel selected channel list should be displayed -->
        <panel-channels
            :class="[
              { 'force-on' : !ch },
              { 'open' : isChannelPanelOpen },
            ]" />

        <!-- no use in displaying messages if no channel -->
        <router-view
          @openThread="onOpenThread"
          />

        <panel-users
            v-if="isUserPanelOpen"
            @openDirectMessage="onOpenDirectChannel" />

        <panel-thread
          v-if="ch && openThread"
          @close="openThread = null"
          :channel="ch"
          :repliesTo="openThread" />
    </main>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import { PanelChannels, PanelUsers, PanelThread } from '../components/Panel'
import { Channel, Message } from '@/types'

export default {
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      user: 'auth/user',
      ch: 'channels/current',
      isChannelPanelOpen: 'ui/isChannelPanelOpen',
      isUserPanelOpen: 'ui/isUserPanelOpen',
      hasFocus: 'ui/hasFocus',
    }),
  },

  data () {
    return {
      openThread: null,
      showChannelCreator: false,
      wideWidth: 768,
      window: {
        width: 0,
        height: 0,
      },
    }
  },

  components: {
    PanelChannels,
    PanelUsers,
    PanelThread,
  },

  beforeCreate () {
    this.$ws.subscribe('channels', (channels) => {
      let cc = []
      channels.forEach((c) => {
        cc.push(new Channel(c))

        // Set unread state for all channels
        this.setChannelUnreadCount({ ID: c.ID, count: (c.view || {}).newMessagesCount })
      })

      this.resetChannels(cc)
    })

    this.$ws.subscribe('channel', (channel) => {
      this.updateChannels(new Channel(channel))
    })

    this.$ws.subscribe('channelJoin', (join) => {
      this.joinChannel(join)
    })

    this.$ws.subscribe('channelPart', (part) => {
      this.partChannel(part)
    })

    // Handle users payload when it gets back
    this.$ws.subscribe('users', (users) => {
      this.resetUsers(users)
    })

    this.$ws.subscribe('clientConnected', (user) => {
      this.userConnected(user.uid)
    })

    this.$ws.subscribe('clientDisconnected', (user) => {
      this.userDisconnected(user.uid)
    })

    // Handles single-message updates that gets from the backend
    this.$ws.subscribe('message', (message) => {
      const msg = new Message(message)
      const currentChannel = msg.channelID === (this.ch || {}).ID
      // const currentUser = this.user.ID === (msg.user || {}).ID
      this.incChannelUnreadCount(msg.channelID)

      if (currentChannel) {
        this.updateHistory([msg])
      }

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
    this.$ws.subscribe('messages', messages => this.updateHistory(messages.map(message => new Message(message))))


    this.$ws.subscribe('commands', (commands) => {
      this.setCommands(commands)
    })

    this.$auth.check().then(() => {
      this.$ws.connect()
    }).catch((err) => {
      console.error(err)
      this.$router.push({ name: 'signin' })
    })

    window.onfocus = () => this.toggleFocus(true)
    window.onblur = () => this.toggleFocus(false)
  },

  created () {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  },

  destroyed () {
    window.removeEventListener('resize', this.handleResize)
  },

  watch: {
    'isAuthenticated' (newval, oldval) {
      if (newval && !oldval) {
        this.$ws.connect()
      } else if (!newval && oldval) {
        this.$ws.close()
      }
    },
  },

  methods: {
    ...mapActions({
      toggleUserPanel: 'ui/toggleUserPanel',
      toggleFocus: 'ui/toggleFocus',
      resetUsers: 'users/resetList',
      resetChannels: 'channels/resetList',
      updateChannels: 'channels/updateList',
      joinChannel: 'channels/join',
      partChannel: 'channels/part',
      removeFromChannels: 'channels/removeFromList',
      userConnected: 'users/connected',
      userDisconnected: 'users/disconnected',
      incChannelUnreadCount: 'unread/incChannel',
      setChannelUnreadCount: 'unread/setChannel',
      updateHistory: 'history/update',
      setCommands: 'suggestions/setCommands',
    }),

    handleResize () {
      this.window.width = window.innerWidth
      this.window.height = window.innerHeight
    },

    onOpenDirectChannel (userId) {
      this.toggleUserPanel(false)
    },

    onOpenThread (e) {
      // Thread opened, set original message to openThread
      // so that <panel-thread> component picks it up and
      // opens itself...
      this.openThread = e.repliesTo
    },
  },
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
main
{
  background-color : $mainbgcolor;
}

.thread {
  width: 40%;
}
</style>
