<template>
    <main>
      <!-- if no channel selected channel list should be displayed -->
      <panel-channels
          :class="[
            { 'force-on' : !ch },
            { 'open' : isChannelPanelOpen },
          ]" />

      <div v-if="!ch" class="welcome"></div>

      <!-- no use in displaying messages if no channel -->
      <router-view
        @openThread="onOpenThread"
        :class="[
        { 'with-thread' : null !== openThread && ch },
        ]" />

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
      toggleFocus: 'ui/toggleFocus',
    }),

    handleResize () {
      this.window.width = window.innerWidth
      this.window.height = window.innerHeight
    },

    onOpenDirectChannel (userId) {
      this.toggleUserPanel(false)
    },

    onOpenThread ({ message }) {
      // Thread opened, set original message to openThread
      // so that <panel-thread> component picks it up and
      // opens itself...
      this.openThread = message.ID
    },
  },
}
</script>
<style>
.welcome
{
  position:absolute;
  top:0;
  left:0;
  right:0;
  bottom:0;
  box-sizing: border-box;
  background: url('../assets/images/crust-logo-with-tagline.png') no-repeat center center #efefef;
  opacity: 0.25;
}
</style>


<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
main
{
  background-color : $mainbgcolor;
}
</style>
