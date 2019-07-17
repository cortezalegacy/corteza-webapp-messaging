<template>
  <div>
    <messenger-base
      v-if="$auth.is()"
      :channel="channel"
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

      <preview-lightbox
        v-if="uiShowPreview"
        :src="uiShowPreview.pdf || uiShowPreview.src"
        :name="uiShowPreview.name"
        :alt="uiShowPreview.name"
        :labels="previewLabels"
        @close="uiShowPreview=null">

        <p slot="header.left">
          {{ uiShowPreview.name }}
        </p>

        <template slot="header.right">
          <a :href="uiShowPreview.download">
            {{ $t('message.file.download') }}
          </a>
        </template>
      </preview-lightbox>

      <quick-search
        v-if="uiShowQuickSearch"
        @close="uiShowQuickSearch=false" />

    </div>
    <global-events
      @keydown.esc.exact="closePopups"
      @keydown.meta.k.exact="toggleQuickSearch"
      @keydown.ctrl.k.exact="toggleQuickSearch" />

  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import QuickSearch from 'corteza-webapp-messaging/src/components/Lightboxed/QuickSearch'
import SearchResults from 'corteza-webapp-messaging/src/components/Lightboxed/SearchResults'
import { cleanMentions } from 'corteza-webapp-messaging/src/lib/mentions'
import TitleNotifications from 'corteza-webapp-messaging/src/lib/title_notifications'
import core from 'corteza-webapp-messaging/src/mixins/core'
import MessengerBase from 'corteza-webapp-messaging/src/components/MessengerBase'
import { PreviewLightbox } from 'corteza-webapp-common/src/components/FilePreview/index'

const titleNtf = new TitleNotifications(document)

export default {
  name: 'Messenger',
  components: {
    SearchResults,
    QuickSearch,
    MessengerBase,
    PreviewLightbox,
  },

  mixins: [ core ],

  data () {
    return {
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
    previewLabels () {
      return {
        loading: this.$t('preview.pdf.loading'),
        downloadForAll: this.$t('preview.pdf.downloadForAll'),
        pageLoadFailed: this.$t('preview.pdf.pageLoadFailed'),
        pageLoading: this.$t('preview.pdf.pageLoading'),
      }
    },

    ...mapGetters({
      findChannelByID: 'channels/findByID',
      channels: 'channels/list',
      findUserByID: 'users/findByID',
      users: 'users/list',
      getSettings: 'settings/get',
    }),

    emojiPickerLoader () {
      // eslint-disable-next-line
      return () => import('emoji-mart-vue').then(({ Picker }) => Picker)
    },

    channelID () {
      return this.$route.params.channelID
    },

    channel () {
      return this.findChannelByID(this.channelID)
    },
  },

  watch: {
    'channelID' () {
      // Channel change means title change
      titleNtf.setChannelName(this.channel ? this.channel.name : null).update()
    },
  },

  created () {
    this.$auth.check(this.$SystemAPI).then(() => {
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
    this.$bus.$off('$core.newMessage', this.handleNotifications)
  },

  methods: {
    ...mapActions({
      loadChannels: 'channels/load',
      loadUsers: 'users/load',
      loadUserStatuses: 'users/loadStatuses',
      loadCommands: 'suggestions/loadCommands',
      updateUnreads: 'unread/update',
    }),

    init () {
      this.loadChannels().then(cc => {
        this.updateUnreads(cc)
      })

      this.loadUsers()
      this.loadCommands()

      this.windowResizeHandler()
      window.addEventListener('resize', this.windowResizeHandler)
      window.addEventListener('focus', this.titleNotificationsHandler)

      titleNtf.update()

      this.$bus.$on('$core.newMessage', this.handleNotifications)

      this.$bus.$on('$message.previewAttachment', ({ url, downloadUrl, name, pdf = undefined }) => {
        this.uiShowPreview = {
          pdf,
          src: url,
          download: downloadUrl,
          name: name,
          caption: name,
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

    closePopups () {
      this.emojiPickerCallback = null
      this.uiShowPreview = null
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

    handleNotifications ({ message }) {
      if (message.updatedAt == null && message.deletedAt == null) {
        // Ignoring deletes & removals
        return
      }

      if (!this.$auth.user || this.$auth.user.userID === message.userID) {
        // Ignore messages we've authored
        return
      }

      if (this.channel && this.channel.channelID === message.channelID && document.hasFocus()) {
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

      if (!(ch.isGroup() && ch.isMember(this.$auth.user.userID))) {
        if (!message.isMentioned(this.$auth.user.userID)) {
          // User is not mentioned.
          // @todo this needs to be a bit more intelligent, take user's settings into account etc...
          return
        }
      }

      if (this.getSettings('mute.all')) {
        return
      }

      const body = cleanMentions(message.message, this.users, this.channels)
      const msgChannel = this.findChannelByID(message.channelID)

      // Please note that this will not work on non secure domains. "http://localhost" is an exception.
      this.$notification.show(`${this.label(this.findUserByID(message.userID))} in ${msgChannel.name} | Crust`, {
        body: body.length > 200 ? body.substring(0, 200) + '...' : body,
      }, {
        onclick: () => {
          this.$router.push({ name: 'channel', params: { channelID: message.channelID } })
        },
      })
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
@import 'corteza-webapp-messaging/src/themes/corteza-base/emojis.scss';
@import 'corteza-webapp-messaging/src/themes/corteza-base/text.scss';

</style>
<style scoped lang="scss">
.main {
  flex: 1;
  background: $light;
  height: 100vh;
  overflow: hidden;
  position: relative;

  .emoji-picker {
    position: absolute;
    bottom: 80px;
    right: 15px;
  }
}

div.helper {
  z-index: 2000;
}

.emoji-mart{
  z-index: 2999;
}

</style>
