<template>
  <div>
    <div class="flex-grid">
      <!-- Left panel -->
      <base-side-panel
        orientation="left"
        :width="250"
        :pinned="isChannelPanelPined"
        :hidden.sync="uiHideChannelSidePanel"
        :disableGestures="isLpDisableGestures"
        key="leftPanel">

        <channels-panel
            @close="hcsp"
            @openQuickSearch="openQuickSearch"
            @searchSubmit="searchSubmit" />

      </base-side-panel>

      <!-- Content -->
      <slot></slot>

      <!-- Right panel -->
      <base-side-panel
        v-if="uiRightSidePanelContent"
        orientation="right"
        :hidden.sync="uiHideRightSidePanel"
        :width="400"
        :pinned="uiPinRightSidePanel"
        key="rightPanel">

        <members-panel
          v-if="isMembersPanel"
          :channel="currentChannel"
          @close="hrsp" />

        <thread-panel
          v-if="isThreadPanel"
          :repliesTo="uiRightSidePanelThreadMessageID"
          @close="hrsp" />

        <pinned-messages-panel
          v-if="isPinnedMessagesPanel"
          :channel="currentChannel"
          @openThreadPanel="srpThread"
          @close="hrsp" />

        <bookmarked-messages-panel
          v-if="isBookmarkedMessagesPanel"
          @openThreadPanel="srpThread"
          @close="hrsp" />

      </base-side-panel>
    </div>
  </div>
</template>

<script>
import BaseSidePanel from '@/components/Panel/Base'
import ChannelsPanel from '@/components/Panel/Channels'
import MembersPanel from '@/components/Panel/Rightside/Members'
import ThreadPanel from '@/components/Panel/Rightside/Thread'
import BookmarkedMessagesPanel from '@/components/Panel/Rightside/BookmarkedMessages'
import PinnedMessagesPanel from '@/components/Panel/Rightside/PinnedMessages'

export default {
  components: {
    BaseSidePanel,
    ChannelsPanel,
    MembersPanel,
    ThreadPanel,
    BookmarkedMessagesPanel,
    PinnedMessagesPanel,
  },

  props: {
    currentChannel: {
      type: Object,
      default: () => ({}),
    },
  },

  data () {
    return {
      // UI control
      uiRightSidePanelThreadMessageID: null,
      uiRightSidePanelContent: null,
      uiPinChannelSidePanel: true,
      uiHideChannelSidePanel: false,
      uiPinRightSidePanel: true,
      hideRightSidePanel: true,

      uiWide: undefined,
    }
  },

  computed: {
    uiHideRightSidePanel: {
      get () {
        return this.hideRightSidePanel
      },
      set (v) {
        this.hideRightSidePanel = v
        if (v) {
          this.uiRightSidePanelContent = null
        }
      },
    },

    isChannelPanelPined () {
      return this.uiPinChannelSidePanel || this.$route.name === 'landing'
    },

    isLpDisableGestures () {
      return !this.uiHideRightSidePanel || this.isChannelPanelPined
    },
    isMembersPanel () {
      return this.uiRightSidePanelContent === 'members'
    },
    isThreadPanel () {
      return this.uiRightSidePanelContent === 'thread'
    },
    isPinnedMessagesPanel () {
      return this.currentChannel && this.uiRightSidePanelContent === 'pinnedMessages'
    },
    isBookmarkedMessagesPanel () {
      return this.uiRightSidePanelContent === 'bookmarkedMessages'
    },
  },

  created () {
    this.$bus.$on('Messenger/tcp', this.tcp)
    this.$bus.$on('Messenger/srpThread', this.srpThread)
    this.$bus.$on('Messenger/srpMembers', this.srpMembers)
    this.$bus.$on('Messenger/srpPinnedMessages', this.srpPinnedMessages)
    this.$bus.$on('Messenger/srpBookmarkedMessages', this.srpBookmarkedMessages)

    this.$bus.$on('Messenger/uiWide', this.windowResizeHandler)
  },
  beforeDestroy () {
    this.$bus.$off('Messenger/tcp', this.tcp)
    this.$bus.$off('Messenger/srpThread', this.srpThread)
    this.$bus.$off('Messenger/srpMembers', this.srpMembers)
    this.$bus.$off('Messenger/srpPinnedMessages', this.srpPinnedMessages)
    this.$bus.$off('Messenger/srpBookmarkedMessages', this.srpBookmarkedMessages)

    this.$bus.$off('Messenger/uiWide', this.windowResizeHandler)
  },

  methods: {
    windowResizeHandler (wide) {
      // We want to pin side panels when screen is wide enough.
      this.uiWide = wide
      this.uiPinChannelSidePanel = wide
      this.uiPinRightSidePanel = wide
    },

    switchRightSidePanel (panel = null, $event = {}) {
      if (panel !== 'thread' && panel === this.uiRightSidePanelContent) {
        this.uiRightSidePanelContent = null
      } else {
        this.uiRightSidePanelContent = panel
      }

      if (this.uiRightSidePanelContent && !this.uiWide) {
        // Close channels when opening right panel and screen is not wide enough
        this.uiHideChannelSidePanel = true
      }

      this.uiHideRightSidePanel = !this.uiRightSidePanelContent

      switch (panel) {
        case 'thread':
          this.uiRightSidePanelThreadMessageID = $event.message.messageID
      }
    },

    toggleChannelSidePanel (state = null) {
      this.uiHideChannelSidePanel = state === null ? !this.uiHideChannelSidePanel : state

      if (!this.uiHideChannelSidePanel && !this.uiWide) {
        // Close right side when screen is not wide enough
        this.switchRightSidePanel(false)
      }
    },

    hcsp () {
      this.toggleChannelSidePanel(true)
    },
    tcp () {
      this.toggleChannelSidePanel()
    },
    hrsp () {
      this.switchRightSidePanel()
    },
    srpThread (e) {
      this.switchRightSidePanel('thread', e)
    },
    srpMembers (e) {
      this.switchRightSidePanel('members', e)
    },
    srpPinnedMessages (e) {
      this.switchRightSidePanel('pinnedMessages', e)
    },
    srpBookmarkedMessages (e) {
      this.switchRightSidePanel('bookmarkedMessages', e)
    },

    openQuickSearch () {
      this.$emit('openQuickSearch')
    },
    searchSubmit (e) {
      this.$emit('searchSubmit', e)
    },
  },

}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

div.flex-grid {
  z-index: 1000;
  background-color: $mainbgcolor;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-flow: row nowrap;
}

</style>
