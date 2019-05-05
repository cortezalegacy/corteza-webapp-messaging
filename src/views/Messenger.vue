<template>
  <div v-if="$auth.is()">
      <div class="flex-grid">
          <base-side-panel
            orientation="left"
            :width="260"
            :pinned="isChannelPanelPined"
            :hidden.sync="uiHideChannelSidePanel"
            :disableGestures="!!uiRightSidePanelContent">
              <channels-panel
                  @close="hideChannelSidePanel"
                  @openQuickSearch="uiShowQuickSearch=true"
                  @searchSubmit="onPanelSearchSubmit" />
          </base-side-panel>

          <!-- no use in displaying messages if no channel -->
          <div class="main">
            <router-view
                @toggleChannelPanel="toggleChannelSidePanel()"
                @openThreadPanel="switchRightSidePanel('thread', $event)"
                @openMembersPanel="switchRightSidePanel('members', $event)"
                @openPinnedMessagesPanel="switchRightSidePanel('pinnedMessages', $event)"
                @openBookmarkedMessagesPanel="switchRightSidePanel('bookmarkedMessages', $event)" />
          </div>

          <base-side-panel
            v-if="uiRightSidePanelContent"
            :hidden="uiHideRightSidePanel"
            orientation="right"
            :width="400"
            :pinned="uiPinRightSidePanel"
            @update:hidden="hideRightPanel">
              <members-panel
                  v-if="uiRightSidePanelContent === 'members'"
                  :channel="currentChannel"
                  @close="switchRightSidePanel()" />

              <thread-panel
                  v-if="uiRightSidePanelContent === 'thread'"
                  @close="switchRightSidePanel()"
                  :repliesTo="uiRightSidePanelThreadMessageID" />

              <pinned-messages-panel
                  v-if="currentChannel && uiRightSidePanelContent === 'pinnedMessages'"
                  :channel="currentChannel"
                  @openThreadPanel="switchRightSidePanel('thread', $event)"
                  @close="switchRightSidePanel()" />

              <bookmarked-messages-panel
                  v-if="uiRightSidePanelContent === 'bookmarkedMessages'"
                  @openThreadPanel="switchRightSidePanel('thread', $event)"
                  @close="switchRightSidePanel()" />
          </base-side-panel>
      </div>
      <div class="helpers">
          <search-results
              v-if="searchQuery"
              @close="searchQuery=null"
              @goToMessage="onGoToMessage"
              :searchQuery="searchQuery" />

          <preview
              v-if="uiShowPreview"
              @close="uiShowPreview=null"
              :src="uiShowPreview.src" />

          <quick-search
              v-if="uiShowQuickSearch"
              @close="uiShowQuickSearch=false"></quick-search>

          <component
              :is="emojiPickerLoader"
              v-show="emojiPickerCallback"
              @select="onEmojiSelect"
              :style="{ position: 'absolute', bottom: '80px', right: uiRightSidePanelContent ? '415px' : '15px' }"
              :showSkinTones="false"
              :showPreview="false"
              :sheetSize="32"
              set="apple"
              :infiniteScroll="false" />
      </div>
      <global-events
          @keydown.esc.exact="emojiPickerCallback=null"
          @keydown.meta.k.exact="toggleQuickSearch"
          @keydown.ctrl.k.exact="toggleQuickSearch" />
    </div>
</template>
<script>
import { mapGetters } from 'vuex'
import BaseSidePanel from '@/components/Panel/Base'
import ChannelsPanel from '@/components/Panel/Channels'
import MembersPanel from '@/components/Panel/Rightside/Members'
import ThreadPanel from '@/components/Panel/Rightside/Thread'
import BookmarkedMessagesPanel from '@/components/Panel/Rightside/BookmarkedMessages'
import PinnedMessagesPanel from '@/components/Panel/Rightside/PinnedMessages'
import Preview from '@/components/Lightboxed/Preview'
import QuickSearch from '@/components/Lightboxed/QuickSearch'
import SearchResults from '@/components/Lightboxed/SearchResults'
import { cleanMentions } from '@/lib/mentions'
import TitleNotifications from '@/lib/title_notifications'
import core from '@/mixins/core'

const titleNtf = new TitleNotifications(document)

export default {
  name: 'Messenger',
  components: {
    BaseSidePanel,
    ChannelsPanel,
    MembersPanel,
    ThreadPanel,
    PinnedMessagesPanel,
    BookmarkedMessagesPanel,
    Preview,
    SearchResults,
    QuickSearch,
  },

  mixins: [ core ],

  data () {
    return {
      searchQuery: null,

      // UI control
      uiShowPreview: null,
      uiRightSidePanelThreadMessageID: null,
      uiRightSidePanelContent: null,
      uiShowQuickSearch: false,
      uiPinChannelSidePanel: null,
      uiHideChannelSidePanel: false,
      uiPinRightSidePanel: null,
      uiHideRightSidePanel: true,

      // What to do when emoji is picked
      emojiPickerCallback: null,
    }
  },

  computed: {
    isChannelPanelPined () {
      return this.uiPinChannelSidePanel || this.$route.name === 'landing'
    },

    emojiPickerLoader () {
      // eslint-disable-next-line
      return () => import('emoji-mart-vue').then(({ Picker }) => Picker)
    },

    ...mapGetters({
      currentChannel: 'channels/current',
      findChannelByID: 'channels/findByID',
      channels: 'channels/list',
      findUserByID: 'users/findByID',
      users: 'users/list',
      getSettings: 'settings/get',
    }),
  },

  watch: {
    'currentChannel' () {
      // Channel change means title change
      titleNtf.setChannelName(this.currentChannel ? this.currentChannel.name : null).update()
    },
  },

  created () {
    this.$auth.check(this.$system).then(() => {
      this.init()
      this.$ws.connect()
    }).catch((err) => {
      console.log(err)
      window.location = '/auth'
    })
  },

  destroyed () {
    titleNtf.stopFlashing()
    window.removeEventListener('focus', this.titleNotificationsHandler)
    window.removeEventListener('resize', this.windowResizeHandler)
    this.$bus.$off('ui.openEmojiPicker')
  },

  methods: {
    init () {
      this.$store.dispatch('channels/load').then(({ unreads }) => {
        this.$store.commit('unread/set', unreads)
      })
      this.$store.dispatch('users/load')
      this.$store.dispatch('users/loadStatuses')
      this.$store.dispatch('suggestions/loadCommands')

      this.windowResizeHandler()
      window.addEventListener('resize', this.windowResizeHandler)

      window.addEventListener('focus', this.titleNotificationsHandler)

      titleNtf.update()

      this.$bus.$on('$core.newMessage', ({ message }) => {
        if (!this.$auth.user || this.$auth.user.ID === (message.user || {}).ID) {
          console.debug('Not notifying, same user')
          // Ignore messages we've authored
          return
        }

        if (this.currentChannel && this.currentChannel.ID === message.channelID && document.hasFocus()) {
          console.debug('Not notifying, in channel, focused')
          // We're already paying atention
          return
        }

        // Set window title so user maybe notice the action in the channel (notifications mixin)
        // @todo not very stable & consistent...
        // titleNtf.flashNew()

        const ch = this.findChannelByID(message.channelID)
        if (!ch) {
          return
        }

        if (ch.membershipFlag === 'ignored') {
          return
        }

        if (ch.isGroup() && ch.isMember(this.$auth.user.ID)) {
          console.debug('Notifying, message sent to our group', { message })
        } else if (!message.isMentioned(this.$auth.user.ID)) {
          console.debug('Not notifying, not mentioned')
          // User is not mentioned.
          // @todo this needs to be a bit more intelegent, take user's settings into account etc...
          return
        }

        if (this.getSettings('mute.all')) {
          console.debug('Suppressing notification due to user settings', { message })
          return
        }

        const body = cleanMentions(message.message, this.users, this.channels)
        const msgChannel = this.findChannelByID(message.channelID)

        console.debug('Sending notification about new message', { message })

        // Please note that this will not work on non secure domains. "http://localhost" is an exception.
        this.$notification.show(`${this.labelUser(message.user)} in ${msgChannel.name} | Crust`, {
          body: body.length > 200 ? body.substring(0, 200) + '...' : body,
        }, {
          onclick: () => {
            this.$router.push({ name: 'channel', params: { channelID: message.channelID } })
          },
        })
      })

      this.$bus.$on('$message.previewAttachment', (attachment) => {
        this.uiShowPreview = {
          src: this.$messaging.baseURL + attachment.url,
          caption: attachment.name,
        }
      })

      // Assigns callback to emojiPickerCallback or sets it to null (of it's already opened)
      this.$bus.$on('ui.openEmojiPicker', ({ callback }) => {
        this.emojiPickerCallback = !this.emojiPickerCallback ? callback : null
      })

      this.$bus.$on('ui.closeEmojiPicker', () => {
        this.emojiPickerCallback = null
      })
    },

    hideRightPanel (hide) {
      if (hide) {
        this.uiRightSidePanelContent = null
        this.uiHideRightSidePanel = true
      }
    },

    onPanelSearchSubmit (query) {
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

    switchRightSidePanel (panel = null, $event = {}) {
      if (panel !== 'thread' && panel === this.uiRightSidePanelContent) {
        this.uiRightSidePanelContent = null
      } else {
        this.uiRightSidePanelContent = panel
      }

      if (this.uiRightSidePanelContent && !this.uiIsWide()) {
        // Close channels when opening right panel and screen is not wide enough
        this.uiHideChannelSidePanel = true
      }

      this.uiHideRightSidePanel = !this.uiRightSidePanelContent

      switch (panel) {
        case 'thread':
          this.uiRightSidePanelThreadMessageID = $event.message.ID
      }
    },

    toggleChannelSidePanel (state = null) {
      this.uiHideChannelSidePanel = state === null ? !this.uiHideChannelSidePanel : state

      if (!this.uiHideChannelSidePanel && !this.uiIsWide()) {
        // Close right side when screen is not wide enough
        this.switchRightSidePanel(false)
      }
    },

    hideChannelSidePanel () {
      this.toggleChannelSidePanel(true)
    },

    titleNotificationsHandler () {
      titleNtf.stopFlashing()
    },

    windowResizeHandler () {
      // We want to pin side panels when screen is wide enough.
      this.uiPinChannelSidePanel = this.uiIsWide()
      this.uiPinRightSidePanel = this.uiIsWide()
    },

    toggleQuickSearch (e) {
      e.preventDefault()
      this.uiShowQuickSearch = !this.uiShowQuickSearch
    },
  },
}
</script>
<style lang="scss">
// General stuff we need everywhere..
@import '@/assets/sass/emojis.scss';
@import '@/assets/sass/text.scss';

</style>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

div.flex-grid {
  z-index: 1000;
  background-color: $mainbgcolor;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-flow: row nowrap;

  .main {
    flex: 1;
    background: $mainbgcolor;
    height: 100vh;
    overflow: hidden;
  }
}

div.helper {
  z-index: 2000;
}

.emoji-mart{
  z-index: 2999;
}

</style>
