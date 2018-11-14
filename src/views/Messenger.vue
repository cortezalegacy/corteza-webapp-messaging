<template>
    <div class="messenger" v-if="isAuthenticated">
        <base-side-panel
          orientation="left"
          :width="260"
          :pinned="uiPinChannelSidePanel"
          :hidden="uiHideChannelSidePanel">
            <channels-panel
                @close="hideChannelSidePanel"
                @openQuickSearch="quickSearch=true"
                @searchSubmit="onPanelSearchSubmit" />
        </base-side-panel>

        <div v-if="!currentChannel" class="welcome"></div>

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
        v-if="rightSidePanel"
        orientation="right"
        :width="400"
        :pinned="true">
          <members-panel
              v-if="rightSidePanel === 'members'"
              :channel="currentChannel"
              @close="switchRightSidePanel()" />

          <thread-panel
              v-if="currentChannel && rightSidePanel === 'thread'"
              @close="switchRightSidePanel()"
              :repliesTo="panelThreadMessageID" />

          <pinned-messages-panel
              v-if="currentChannel && rightSidePanel === 'pinnedMessages'"
              :channel="currentChannel"
              @openThreadPanel="switchRightSidePanel('thread', $event)"
              @close="switchRightSidePanel()" />

          <bookmarked-messages-panel
              v-if="currentChannel && rightSidePanel === 'bookmarkedMessages'"
              @openThreadPanel="switchRightSidePanel('thread', $event)"
              @close="switchRightSidePanel()" />
      </base-side-panel>
<!--
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
          :style="{ position: 'absolute', bottom: '80px', right: rightSidePanel ? '415px' : '15px' }"
          :native="true"
          :showSkinTones="false"
          :showPreview="false"
          :sheetSize="16"
          set="apple" />
-->
      <global-events
          @keydown.esc.exact="emojiPickerCallback=null"
          @keydown.meta.k.exact="quickSearch=!quickSearch" />
    </div>
</template>
<script>
import { mapGetters } from 'vuex'
import ClickOutside from 'vue-click-outside'
import BaseSidePanel from '@/components/Panel/Base'
import ChannelsPanel from '@/components/Panel/Channels'
import MembersPanel from '@/components/Panel/Rightside/Members'
import ThreadPanel from '@/components/Panel/Rightside/Thread'
import BookmarkedMessagesPanel from '@/components/Panel/Rightside/BookmarkedMessages'
import PinnedMessagesPanel from '@/components/Panel/Rightside/PinnedMessages'
import Preview from '@/components/Lightboxed/Preview'
import QuickSearch from '@/components/Lightboxed/QuickSearch'
import SearchResults from '@/components/Lightboxed/SearchResults'
import { Picker } from 'emoji-mart-vue'
import { User } from '@/types'
import { cleanMentions } from '@/lib/mentions'
import TitleNotifications from '@/lib/title_notifications'

const titleNtf = new TitleNotifications(document)

export default {
  data () {
    return {
      preview: null,
      leftSidePanel: true,
      panelThreadMessageID: null,
      rightSidePanel: true,
      searchQuery: null,
      quickSearch: false,
      showChannelCreator: false,
      emojiPickerCallback: null,
      wideWidth: 768,

      uiPinChannelSidePanel: null,
      uiHideChannelSidePanel: false,
      uiPinRightSidePanel: false,
      uiHideRightSidePanel: true,
    }
  },

  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      currentUser: 'auth/user',
      currentChannel: 'channels/current',
      findChannelByID: 'channels/findByID',
      channels: 'channels/list',
      findUserByID: 'users/findByID',
      users: 'users/list',
      getSettings: 'settings/get',
    }),
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
    this.windowResizeHandler()
    window.addEventListener('resize', this.windowResizeHandler)

    window.addEventListener('focus', this.titleNotificationsHandler)

    titleNtf.update()

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

      // Set window title so user maybe notice the action in the channel (notifications mixin)
      titleNtf.flashNew()

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

      const body = cleanMentions(message.message, this.users, this.channels)
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
    titleNtf.stopFlashing()
    window.removeEventListener('focus', this.titleNotificationsHandler)
    window.removeEventListener('resize', this.windowResizeHandler)
    this.$bus.$off('ui.openEmojiPicker')
  },

  watch: {
    'isAuthenticated' (isAuthenticated) {
      if (isAuthenticated) {
        this.$ws.connect()
      }
    },

    'currentChannel' () {
      // Channel change means title change
      titleNtf.setChannelName(this.currentChannel ? this.currentChannel.name : null).update()
    },
  },

  methods: {
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
      if (panel !== 'thread' && panel === this.rightSidePanel) {
        this.rightSidePanel = null
      } else {
        this.rightSidePanel = panel
      }

      switch (panel) {
        case 'thread':
          this.panelThreadMessageID = $event.message.ID
      }
    },

    toggleChannelSidePanel (state = null) {
      this.uiHideChannelSidePanel = state === null ? !this.uiHideChannelSidePanel : state
      console.log('Setting uiHideChannelSidePanel to %o using %o', this.uiHideChannelSidePanel, state)
    },

    hideChannelSidePanel () {
      this.toggleChannelSidePanel(true)
    },

    titleNotificationsHandler () {
      titleNtf.stopFlashing()
    },

    windowResizeHandler () {
      this.uiPinChannelSidePanel = this.uiIsWide()
    },
  },

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
    Picker,
  },

  directives: {
    ClickOutside,
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

div.messenger
{
  background-color : $mainbgcolor;
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

/*
  .welcome
  {
    display: table-cell;
    box-sizing: border-box;
    background: url('../assets/images/crust-logo-with-tagline.png') no-repeat center center #efefef;
    opacity: 0.25;
  }
  */
  .emoji-mart{
    z-index: 99999;
  }
}

</style>
