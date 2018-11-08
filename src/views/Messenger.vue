<template>
    <section class="messenger"
        v-if="isAuthenticated"
        :class="{
            'left-panel-open': isChannelPanelOpen,
            'right-panel-open': isRightPanelOpen,
        }">
        <!-- if no channel selected channel list should be displayed -->
        <channels-panel
            @openQuickSearch="quickSearch=true"
            @searchSubmit="onPanelSearchSubmit"
            :class="{'force-on': !currentChannel,  'open': isChannelPanelOpen}" />

        <div v-if="!currentChannel" class="welcome"></div>

        <!-- no use in displaying messages if no channel -->
        <router-view
          @panelThreadMessageID="panelThreadMessageID = $event.message.ID"
          @panelMembersOpen="panelMembersOpen = !panelMembersOpen"
          class="channel-container" />

        <users-panel
            v-if="panelMembersOpen"
            :channel="currentChannel"
            @close="panelMembersOpen = false"
            @openDirectMessage="onOpenDirectChannel" />

        <thread-panel
            v-if="currentChannel && panelThreadMessageID"
            @close="panelThreadMessageID = null"
            :repliesTo="panelThreadMessageID" />

        <search-results
          v-if="searchQuery"
          @close="searchQuery=null"
          @goToMessage="onGoToMessage"
          :searchQuery="searchQuery" />

        <preview
          v-if="preview"
          @close="preview=null"
          :src="preview.src" />

        <quick-search
          v-if="quickSearch"
          @close="quickSearch=false"></quick-search>

        <picker
          v-if="emojiPickerCallback"
          @select="onEmojiSelect"
          :style="{ position: 'absolute', bottom: '80px', right: isRightPanelOpen ? '415px' : '15px' }"
          :native="true"
          :showSkinTones="false"
          :showPreview="false"
          :sheetSize="16"
          set="apple" />

        <global-events
            @keydown.esc.exact="emojiPickerCallback=null"
            @keydown.meta.k.exact="quickSearch=!quickSearch" />
    </section>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import ChannelsPanel from '@/components/Panel/Channels'
import UsersPanel from '@/components/Panel/Users'
import ThreadPanel from '@/components/Panel/Thread'
import GPanel from '@/components/Panel'
import Preview from '@/components/Lightboxed/Preview'
import QuickSearch from '@/components/Lightboxed/QuickSearch'
import SearchResults from '@/components/Lightboxed/SearchResults'
import { Picker } from 'emoji-mart-vue'
import { User } from '@/types'

export default {
  data () {
    return {
      preview: null,
      panelThreadMessageID: null,
      panelMembersOpen: false,
      searchQuery: null,
      quickSearch: false,
      showChannelCreator: false,
      emojiPickerCallback: null,
      wideWidth: 768,
      window: {
        width: 0,
        height: 0,
      },
    }
  },

  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      currentUser: 'auth/user',
      currentChannel: 'channels/current',
      findChannelByID: 'channels/findByID',
      findUserByID: 'users/findByID',
      isChannelPanelOpen: 'ui/isChannelPanelOpen',
      getSettings: 'settings/get',
    }),

    isRightPanelOpen () {
      return this.panelThreadMessageID !== null || this.panelMembersOpen
    },
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
      if (!this.currentUser || this.currentUser.ID === (message.user || {}).ID) {
        console.debug('Not notifying, same user')
        // Ignore messages we've authored
        return
      }

      if (this.currentChannel.ID === message.channelID && document.hasFocus()) {
        console.debug('Not notifying, in channel, focused')
        // We're already paying atention
        return
      }

      if (!message.isMentioned(this.currentUser.ID)) {
        console.debug('Not notifying, not mentioned')
        // User is not mentioned.
        // @todo this needs to be a bit more intelegent, take user's settings into account etc...
        return
      }

      if (this.getSettings('mute.all')) {
        console.debug('Suppressing notification due to user settings', { message })
        return
      }

      const body = message.message
      const msgChannel = this.findChannelByID(message.channelID)

      console.debug('Sending notification about new message', { message })

      // Please note that this will not work on non secure domains. "http://localhost" is an exception.
      this.$notification.show(`${(new User(message.user)).Label()} in ${msgChannel.name} | Crust`, {
        body: body.length > 200 ? body.substring(0, 200) + '...' : body,
      }, {
        onclick: () => {
          this.$router.push({ name: 'channel', params: { channelID: message.channelID } })
        },
      })
    })

    this.$bus.$on('$message.previewAttachment', (attachment) => {
      this.preview = {
        src: this.$rest.baseURL() + attachment.url,
        caption: attachment.name,
      }
    })

    // Assigns callback to emojiPickerCallback or sets it to null (of it's already opened)
    this.$bus.$on('ui.openEmojiPicker', ({ callback }) => {
      this.emojiPickerCallback = !this.emojiPickerCallback ? callback : null
    })
  },

  destroyed () {
    window.removeEventListener('resize', this.handleResize)
    this.$bus.$off('ui.openEmojiPicker')
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

    onEmojiSelect (emoji) {
      this.emojiPickerCallback(emoji)
      this.emojiPickerCallback = null
    },
  },

  components: {
    ChannelsPanel,
    UsersPanel,
    ThreadPanel,
    GPanel,
    Preview,
    SearchResults,
    QuickSearch,
    Picker,
  },
}
</script>
<style lang="scss">
// General stuff we need everywhere..
@import '@/assets/sass/emojis.scss';
</style>
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
  margin-left:300px;
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
    margin-left:300px;
    max-width:calc(100vw - 300px);
  }
}

</style>
