<template>
    <section class="messenger"
        v-if="isAuthenticated"
        :class="{
            'left-panel-open': isChannelPanelOpen,
            'right-panel-open': null !== openThread && currentChannel,
        }">
        <!-- if no channel selected channel list should be displayed -->
        <panel-channels
            @searchSubmit="onPanelSearchSubmit"
            :class="{'force-on': !currentChannel,  'open': isChannelPanelOpen}" />

        <div v-if="!currentChannel" class="welcome"></div>

        <!-- no use in displaying messages if no channel -->
        <router-view
          @openThread="onOpenThread"
          class="channel-container" />

        <panel-users
            v-if="isUserPanelOpen"
            @openDirectMessage="onOpenDirectChannel" />

        <panel-thread
            v-if="currentChannel && openThread"
            @close="openThread = null"
            :repliesTo="openThread" />

        <search-results
          v-if="searchQuery"
          @close="searchQuery=null"
          @goToMessage="onGoToMessage"
          :searchQuery="searchQuery" />

        <preview
          v-if="preview"
          @close="preview=null"
          :src="preview.src" />

     </section>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import { PanelChannels, PanelUsers, PanelThread } from '../components/Panel'
import Preview from '../components/Lightboxed/Preview'
import SearchResults from '../components/Lightboxed/SearchResults'
import { User } from '@/types'

export default {
  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      currentUser: 'auth/user',
      currentChannel: 'channels/current',
      findChannelByID: 'channels/findByID',
      findUserByID: 'users/findByID',
      isChannelPanelOpen: 'ui/isChannelPanelOpen',
      isUserPanelOpen: 'ui/isUserPanelOpen',
      getSettings: 'settings/get',
    }),
  },

  data () {
    return {
      preview: null,
      openThread: null,
      searchQuery: null,
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
    Preview,
    SearchResults,
  },

  beforeCreate () {
    this.$system.authCheck().then((check) => {
      this.$store.commit('auth/setUser', check.user)
    }).catch((err) => {
      this.$store.commit('auth/clean')
      console.error(err)
      this.$router.push({ name: 'signin' })
    })
  },

  created () {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()

    this.$bus.$on('$core.newMessage', ({ message }) => {
      const isCurrentChannel = (this.currentChannel || {}).ID === message.channelID
      const isCurrentUser = (this.currentUser || {}).ID === (message.user || {}).ID

      if (!isCurrentUser && (!isCurrentChannel || !document.hasFocus())) {
        if (this.getSettings('mute.all')) {
          console.debug('Suppressing notification due to user settings', { message })
          return
        }

        const body = message.message
        const msgChannel = this.findChannelByID(message.channelID)

        this.$notification.show(`${(new User(message.user)).Label()} in ${msgChannel.name} | Crust`, {
          body: body.length > 200 ? body.substring(0, 200) + '...' : body,
        }, {
          onclick: () => {
            this.$router.push({ name: 'channel', params: { channelID: message.channelID } })
          },
        })
      }
    })

    this.$bus.$on('$message.previewAttachment', (attachment) => {
      this.preview = {
        src: this.$rest.baseURL() + attachment.url,
        caption: attachment.name,
      }
    })
  },

  destroyed () {
    window.removeEventListener('resize', this.handleResize)
  },

  watch: {
    'isAuthenticated' (isAuthenticated) {
      if (isAuthenticated) {
        this.$ws.connect()
      }
    },

    'currentChannel' () {
      if (this.currentChannel) {
        document.title = `${this.currentChannel.name} | Crust`
      } else {
        document.title = `Crust`
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

    onPanelSearchSubmit ({ query }) {
      // Take query we received from panel search input box
      // and push it to search result component
      this.searchQuery = query
    },

    onGoToMessage ({ message }) {
      // Handling go-to-message request

      // close search
      this.searchQuery = null

      // go to channel
      this.$router.push({ name: 'channel', params: { channelID: message.channelID, messageID: message.ID } })
    },
  },
}
</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

.messenger
{
  overflow-y: hidden;
}

section
{
  background-color : $mainbgcolor;
}

.channel-container
{
  position:relative;
  margin:0;
  height:100vh;
}

.left-panel-open .channel-container
{
  margin-left:320px;
}

.right-panel-open .channel-container
{
  margin-right:400px;
}

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

@media (min-width: $wideminwidth)
{
  .channel-container
  {
    margin-left:320px;
    max-width:calc(100vw - 320px);
  }
}

</style>
