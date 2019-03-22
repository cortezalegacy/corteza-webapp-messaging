<template>
  <div>
    <messenger-base
      v-if="$auth.is()"
      :currentChannel="currentChannel"
      @openQuickSearch="uiShowQuickSearch=true"
      @searchSubmit="searchQuery=$event">

      <div key="content" class="main">
        <router-view
          :key="$route.name"
          @toggleChannelPanel="$bus.$emit('Messenger/toggleChannelSidePanel', $event)"
          @openThreadPanel="$bus.$emit('Messenger/switchRightSidePanel', { type: 'thread', e: $event })"
          @openMembersPanel="$bus.$emit('Messenger/switchRightSidePanel', { type: 'members', e: $event })"
          @openPinnedMessagesPanel="$bus.$emit('Messenger/switchRightSidePanel', { type: 'pinnedMessages', e: $event })"
          @openBookmarkedMessagesPanel="$bus.$emit('Messenger/switchRightSidePanel', { type: 'bookmarkedMessages', e: $event })" />

        <component
          v-show="emojiPickerCallback"
          class="emoji-picker"
          set="apple"
          :is="emojiPickerLoader"
          :showSkinTones="false"
          :showPreview="false"
          :sheetSize="32"
          :infiniteScroll="false"
          @select="onEmojiSelect" />

      </div>
    </messenger-base>

    <div class="helpers">
      <search-results
        v-if="searchQuery"
        :searchQuery="searchQuery"
        @close="searchQuery=null"
        @goToMessage="onGoToMessage" />

      <preview
        v-if="uiShowPreview"
        :src="uiShowPreview.src"
        @close="uiShowPreview=null" />

      <quick-search
        v-if="uiShowQuickSearch"
        @close="uiShowQuickSearch=false" />

    </div>
    <global-events
      @keydown.esc.exact="emojiPickerCallback=null"
      @keydown.meta.k.exact="toggleQuickSearch"
      @keydown.ctrl.k.exact="toggleQuickSearch" />

  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import Preview from '@/components/Lightboxed/Preview'
import QuickSearch from '@/components/Lightboxed/QuickSearch'
import SearchResults from '@/components/Lightboxed/SearchResults'
import { cleanMentions } from '@/lib/mentions'
import TitleNotifications from '@/lib/title_notifications'
import core from '@/mixins/core'
import MessengerBase from '@/components/MessengerBase'

const titleNtf = new TitleNotifications(document)

export default {
  name: 'Messenger',
  components: {
    Preview,
    SearchResults,
    QuickSearch,
    MessengerBase,
  },

  mixins: [ core ],

  data () {
    return {
      logo: require('@/assets/images/crust-logo-with-tagline.png'),
      loaded: false,
      searchQuery: null,

      // UI control
      uiShowPreview: null,
      uiShowQuickSearch: false,
      uiWide: undefined,

      // What to do when emoji is picked
      emojiPickerCallback: null,
    }
  },

  computed: {
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
      console.debug(err)
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

      setTimeout(() => {
        this.loaded = true
      }, 1000)

      this.windowResizeHandler()
      window.addEventListener('resize', this.windowResizeHandler)
      window.addEventListener('focus', this.titleNotificationsHandler)

      titleNtf.update()

      this.$bus.$on('$core.newMessage', ({ message }) => {
        if (!this.$auth.user || this.$auth.user.userID === message.userID) {
          console.debug('Not notifying, same user')
          // Ignore messages we've authored
          return
        }

        if (this.currentChannel && this.currentChannel.channelID === message.channelID && document.hasFocus()) {
          console.debug('Not notifying, in channel, focused')
          // We're already paying attention
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

        if (ch.isGroup() && ch.isMember(this.$auth.user.userID)) {
          console.debug('Notifying, message sent to our group', { message })
        } else if (!message.isMentioned(this.$auth.user.userID)) {
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
        this.$notification.show(`${this.label(this.findUserByID(message.userID))} in ${msgChannel.name} | Crust`, {
          body: body.length > 200 ? body.substring(0, 200) + '...' : body,
        }, {
          onclick: () => {
            this.$router.push({ name: 'channel', params: { channelID: message.channelID } })
          },
        })
      })

      this.$bus.$on('$message.previewAttachment', (attachment) => {
        this.uiShowPreview = {
          src: attachment.url,
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

    onGoToMessage ({ message }) {
      // Handling go-to-message request

      // close search
      this.searchQuery = null

      // go to channel
      this.$router.push({ name: 'channel', params: { channelID: message.channelID, messageID: message.messageID } })
    },

    onEmojiSelect (emoji) {
      this.emojiPickerCallback(emoji)
      this.emojiPickerCallback = null
    },

    titleNotificationsHandler () {
      titleNtf.stopFlashing()
    },

    windowResizeHandler () {
      const wide = this.uiIsWide()
      // Avoid unneded events
      if (wide !== this.uiWide) {
        this.$bus.$emit('Messenger/uiWide', wide)
        this.uiWide = wide
      }
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

.main {
  flex: 1;
  background: $mainbgcolor;
  height: 100vh;
  overflow: hidden;
  position: relative;

  .emoji-picker {
    position: absolute;
    bottom: 80px;
    right: 15px;
  }
}

@keyframes flickerAnimation {
  0% { opacity: 0; }
  50% { opacity: 0.8; }
  100% { opacity: 0; }
}

.loader {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
  background-color: #efefef;

  img {
    align-self: center;
    width: 80%;
    opacity: 0;
    animation: flickerAnimation 3s infinite;
  }
}

.fade-enter-to, .fade-leave-active {
  transition: opacity .4s;
}
.fade-enter-to, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0.1;
}

div.helper {
  z-index: 2000;
}

.emoji-mart{
  z-index: 2999;
}

</style>
