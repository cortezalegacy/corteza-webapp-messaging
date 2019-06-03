<template>
  <div>
    <div class="flex-grid">
      <!-- Left panel -->
      <base-side-panel
        orientation="left"
        :width="250"
        :pinned="isChannelPanelPinned"
        :hidden.sync="uiHideChannelSidePanel"
        :disableGestures="isLeftPanelDisableGestures"
        key="leftPanel">

        <channels-panel
            @close="toggleChannelSidePanel(true)"
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
          @close="switchRightSidePanel()" />

        <thread-panel
          v-if="isThreadPanel"
          :repliesTo="uiRightSidePanelThreadMessageID"
          @close="switchRightSidePanel()" />

        <pinned-messages-panel
          v-if="isPinnedMessagesPanel"
          :channel="currentChannel"
          @openThreadPanel="switchRightSidePanel('thread', $event)"
          @close="switchRightSidePanel()" />

        <bookmarked-messages-panel
          v-if="isBookmarkedMessagesPanel"
          @openThreadPanel="switchRightSidePanel('thread', $event)"
          @close="switchRightSidePanel()" />

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

    isChannelPanelPinned () {
      return this.uiPinChannelSidePanel || this.$route.name === 'landing'
    },

    isLeftPanelDisableGestures () {
      return !this.uiHideRightSidePanel || this.isChannelPanelPinned
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
    this.$bus.$on('Messenger/toggleChannelSidePanel', this.toggleChannelSidePanel)
    this.$bus.$on('Messenger/switchRightSidePanel', ({ type, e }) => this.switchRightSidePanel(type, e))

    this.$bus.$on('Messenger/uiWide', this.windowResizeHandler)
  },
  beforeDestroy () {
    this.$bus.$off('Messenger/toggleChannelSidePanel', this.toggleChannelSidePanel)
    this.$bus.$off('Messenger/switchRightSidePanel', ({ type, e }) => this.switchRightSidePanel(type, e))

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
