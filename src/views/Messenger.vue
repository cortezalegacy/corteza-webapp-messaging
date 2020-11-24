<template>
  <div>
    <messenger-base
      v-if="$auth.is() && loaded"
      :channel="channel"
      @openQuickSearch="uiShowQuickSearch=true"
      @searchSubmit="searchQuery=$event"
    >
      <div
        key="content"
        class="main"
      >
        <router-view
          :key="$route.name"
          @toggleChannelPanel="$bus.$emit('Messenger/toggleChannelSidePanel', $event)"
          @openThreadPanel="$bus.$emit('Messenger/switchRightSidePanel', { type: 'thread', e: $event })"
          @openMembersPanel="$bus.$emit('Messenger/switchRightSidePanel', { type: 'members', e: $event })"
          @openPinnedMessagesPanel="$bus.$emit('Messenger/switchRightSidePanel', { type: 'pinnedMessages', e: $event })"
          @openBookmarkedMessagesPanel="$bus.$emit('Messenger/switchRightSidePanel', { type: 'bookmarkedMessages', e: $event })"
        />

        <component
          :is="emojiPickerLoader"
          v-show="emojiPickerCallback"
          class="emoji-picker"
          set="apple"
          :show-skin-tones="false"
          :show-preview="false"
          :sheet-size="32"
          :infinite-scroll="false"
          @select="onEmojiSelect"
        />
      </div>
    </messenger-base>

    <div class="helpers">
      <search-results
        v-if="searchQuery"
        :search-query="searchQuery"
        @close="searchQuery=null"
        @goToMessage="onGoToMessage"
      />

      <c-preview-lightbox
        v-if="uiShowPreview"
        :src="uiShowPreview.document || uiShowPreview.src"
        :name="uiShowPreview.name"
        :meta="uiShowPreview.meta"
        :alt="uiShowPreview.name"
        :labels="previewLabels"
        @close="uiShowPreview=null"
      >
        <p slot="header.left">
          {{ uiShowPreview.name }}
        </p>

        <template slot="header.right">
          <a :href="uiShowPreview.download">
            {{ $t('message.file.download') }}
          </a>
        </template>
      </c-preview-lightbox>

      <quick-search
        v-if="uiShowQuickSearch"
        @close="uiShowQuickSearch=false"
      />
    </div>
    <global-events
      @keydown.esc.exact="closePopups"
      @keydown.meta.k.exact="toggleQuickSearch"
      @keydown.ctrl.k.exact="toggleQuickSearch"
    />
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import QuickSearch from 'corteza-webapp-messaging/src/components/Lightboxed/QuickSearch'
import SearchResults from 'corteza-webapp-messaging/src/components/Lightboxed/SearchResults'
import TitleNotifications from 'corteza-webapp-messaging/src/lib/title_notifications'
import core from 'corteza-webapp-messaging/src/mixins/core'
import MessengerBase from 'corteza-webapp-messaging/src/components/MessengerBase'
import pusher from 'corteza-webapp-messaging/src/mixins/pusher'
import { components } from '@cortezaproject/corteza-vue'
const { CPreviewLightbox } = components

const titleNtf = new TitleNotifications(document)

export default {
  name: 'Messenger',
  components: {
    SearchResults,
    QuickSearch,
    MessengerBase,
    CPreviewLightbox,
  },

  mixins: [core, pusher],

  data () {
    return {
      loaded: false,

      searchQuery: null,

      // UI control
      uiShowPreview: null,
      uiShowQuickSearch: false,
      uiWide: undefined,

      // What to do when emoji is picked
      emojiPickerCallback: null,

      wakeCheck: {
        timeout: 1000 * 60 * 1, // 1m
        window: 1000 * 5, // 5s
        last: null,
        i: null, // interval
      },
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
      getSettings: 'settings/get',
      uiIsCordovaPlatform: 'ui/isCordovaPlatform',
      uiIsWide: 'ui/isWide',
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
    this.$auth.check().then((user) => {
      if (!user) {
        // check performed: no error & no user,
        // redirect to auth
        throw new Error()
      }
      this.$Settings.init({ api: this.$SystemAPI }).then(() => {
        this.init()
        this.$ws.connect()
      })
    }).catch((e) => {
      if (this.uiIsCordovaPlatform) {
        this.$router.push({ name: 'auth' })
      } else {
        this.$auth.open()
        window.location = '/auth'
      }
    })
  },

  destroyed () {
    titleNtf.stopFlashing()
    window.removeEventListener('focus', this.titleNotificationsHandler)
    window.removeEventListener('resize', this.windowResizeHandler)
    this.$bus.$off('ui.openEmojiPicker')
    if (this.wakeCheck.i) window.clearInterval(this.wakeCheck.i)
  },

  methods: {
    ...mapActions({
      loadChannels: 'channels/load',
      loadCommands: 'suggestions/loadCommands',
      updateChannelUnreads: 'unread/fromChannel',
      loadSession: 'session/load',
    }),

    init () {
      this.loadChannels().then(cc => {
        cc.forEach((c) => this.updateChannelUnreads(c))
      })

      this.loadCommands()
      this.loadSession()
      if (this.uiIsCordovaPlatform) {
        setTimeout(navigator.splashscreen.hide, 1000)
      }

      setTimeout(() => {
        // Delay first call to window-resize handler
        //
        // not the most optimal solution but we're triggering event-handlers
        // in the child component (yes, I know...)
        this.windowResizeHandler()
      }, 500)

      window.addEventListener('resize', this.windowResizeHandler)
      window.addEventListener('focus', this.titleNotificationsHandler)

      titleNtf.update()

      this.$bus.$on('$message.previewAttachment', ({ src, download, name, document = undefined, meta }) => {
        this.uiShowPreview = {
          document,
          meta,
          src,
          download,
          name,
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

      this.$root.$on('wake', () => {
        this.loadChannels().then(cc => {
          cc.forEach((c) => this.updateChannelUnreads(c))
        })
      })

      this.wakeCheck.i = setInterval(() => {
        const currentTime = (new Date()).getTime()
        if (this.wakeCheck.last) {
          if (currentTime > (this.wakeCheck.last + this.wakeCheck.timeout + this.wakeCheck.window)) {
            this.$root.$emit('wake', {
              lost: currentTime - this.wakeCheck.last,
            })
          }
        }
        this.wakeCheck.last = currentTime
      }, this.wakeCheck.timeout)

      this.loaded = true
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

      if (message.replies) {
        this.$bus.$emit('Messenger/switchRightSidePanel', { type: 'thread', e: { message } })
      } else {
        this.$bus.$emit('Messenger/switchRightSidePanel', {})
      }
    },

    onEmojiSelect (emoji) {
      this.emojiPickerCallback(emoji)
      this.emojiPickerCallback = null
    },

    titleNotificationsHandler () {
      titleNtf.stopFlashing()
    },

    windowResizeHandler () {
      const wide = this.uiIsWide

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
