<template>
    <main :class="['crust_iam_main', (window.width > wideWidth? 'wide' : 'slim') ]" :data-width="window.width">
      <panel-channels
        v-if="window.width > wideWidth || isChannelPanelOpen"></panel-channels>
      <router-view/>
      <panel-users
        v-if="isUserPanelOpen"
        @openDirectMessage="onOpenDirectChannel"
        ></panel-users>
    </main>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import { PanelChannels, PanelUsers } from '../components/Panel'

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
      this.resetChannels(channels)
    })

    this.$ws.subscribe('channel', (channel) => {
      this.updateChannels(channel)
    })

    this.$ws.subscribe('channelDeleted', (channel) => {
      this.removeFromChannels(channel)
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
      removeFromChannels: 'channels/removeFromList',
      userConnected: 'users/connected',
      userDisconnected: 'users/disconnected',
    }),

    handleResize () {
      this.window.width = window.innerWidth
      this.window.height = window.innerHeight
    },

    onOpenDirectChannel (userId) {
      this.toggleUserPanel(false)
      this.$router.push({
        name: 'user',
        params: { userId },
      })
    },
  },
}
</script>
<style lang="scss">

</style>

