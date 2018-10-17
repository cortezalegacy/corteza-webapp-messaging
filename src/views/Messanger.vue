<template>
    <main>
      <!-- if no channel selected channel list should be displayed -->
      <panel-channels
        :class="[
          { 'force-on' : !ch },
          { 'open' : isChannelPanelOpen },
        ]"></panel-channels>
      <!-- no use in displaying messages if no channel -->
      <router-view />
      <panel-users
        v-if="isUserPanelOpen"
        @openDirectMessage="onOpenDirectChannel"
        ></panel-users>
    </main>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import { PanelChannels, PanelUsers } from '../components/Panel'
import { Channel, Message } from '@/types'

export default {
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      user: 'auth/user',
      ch: 'channels/current',
      isChannelPanelOpen: 'ui/isChannelPanelOpen',
      isUserPanelOpen: 'ui/isUserPanelOpen',
    }),
  },

  data () {
    return {
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
      this.incChannelUnreadCount(msg.channelID)

      if (msg.channelID === (this.ch || {}).ID) {
        this.pushSingleMessageToHistory(msg)
      }
    })

    // This serves a sole purpose of handling callback to getMessage calls to $ws
    this.$ws.subscribe('messages', messages => this.pushMessagesToHistory(messages.map(message => new Message(message))))


    this.$auth.check().then(() => {
      this.$ws.connect()
    }).catch((err) => {
      console.error(err)
      this.$router.push({ name: 'signin' })
    })
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
      pushSingleMessageToHistory: 'history/pushSingle',
      pushMessagesToHistory: 'history/push',
    }),

    handleResize () {
      this.window.width = window.innerWidth
      this.window.height = window.innerHeight
    },

    onOpenDirectChannel (userId) {
      this.toggleUserPanel(false)
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
</style>
