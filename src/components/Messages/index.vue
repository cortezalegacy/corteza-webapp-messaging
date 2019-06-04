<template>
  <div
    @click="$bus.$emit('ui.closeEmojiPicker')"
    class="messages-wrapper">
    <chat-scroller
      ref="chatScroller"
      class="dynamic-scroller"
      :key="$route.path"
      :item-pool="getItems"
      :min-height="30"
      :view-pool-size-mult="3"
      :scrollable="scrollable"
      start-bottom
      @scroll:top="onTop"
      @scroll:bottom="onBottom"
      @scroll:top:first="$emit('scrollTop', { messageID: getFirstID })"
      @item:new:invisible="alertNew"
      @scroll:bottom:last="onScrollBottom">

      <template v-slot="{ item, index }">
        <message
          class="msg"
          :listeners="$listeners"
          @markAsUnread="markAsUnread(index)"
          @cancelEditing="$emit('cancelEditing')"
          :item="item" />

      </template>
    </chat-scroller>

    <div
      v-if="showGoToLast"
      class="alert-bar go-down"
      :class="{ visible: showGoToLast }">

      <button class="goto" @click="gotoItem({ index: getItems.length - 1 })">
        {{ $t('message.gotoLatestMessage') }}
      </button>
    </div>

    <!-- <div
      v-if="firstOutOfView"
      class="alert-bar"
      :class="{ visible: !!this.firstOutOfView }">

      <button class="goto" @click="gotoLastUnread">
        {{ $t('message.gotoLatestMessage') }}
      </button>
    </div> -->
  </div>
</template>
<script>
import Message from './Message'
import { getFirstID, getLastID, isConsecutive } from '@/lib/messages'
import { ChatScroller } from 'vue-chat-scroller'

export default {
  components: {
    Message,
    ChatScroller,
  },

  props: {
    currentUser: {
      type: Object,
      required: true,
    },

    messages: {
      type: Array,
      required: true,
    },

    readOnly: Boolean,

    // We can not just watch for updates of messages
    // sometime we need to react only when origin changes (whatever origin is)
    origin: { required: true },

    scrollable: { type: Boolean, value: true },

    // This will help us mark new messages
    lastReadMessageID: {
      type: String,
    },

    // Is provided message list is consecutive
    //
    // When not, we do not calculate cont
    consecutive: { type: Boolean, default: true },

    hideActions: Boolean,
    hideReactions: Boolean,
    hidePinning: Boolean,
    hideBookmarking: Boolean,
    hideActionGoToMessage: { type: Boolean, default: true },
    hideActionOpenThread: Boolean,
    hideActionsMenu: Boolean,

    // Set to true to enable edit mode for last message from currentUser
    editLastMessage: Boolean,

    // Controling bookmarked and pinned messages highlighting
    highlightBookmarked: { type: Boolean, default: true },
    highlightPinned: { type: Boolean, default: true },
  },

  data () {
    return {
      loadSuspended: false,
      allowAutoScroll: true,
      scrollToRef: false,
      firstOutOfView: undefined,
      showGoToLast: false,

      // Recounts messages on each update, so we can know
      // of new messages are added
      lastMessageID: null,
    }
  },

  computed: {
    getFirstID () {
      return getFirstID(this.messages)
    },
    getItems () {
      return this.messages.map((m, index) => ({
        // @todo allow custom id fields
        id: m.messageID,
        message: m,
        readOnly: this.readOnly,
        consecutive: this.consecutive && isConsecutive(this.messages, index),
        currentUser: this.currentUser,
        isUnread: !!this.lastReadMessageID && this.lastReadMessageID < m.messageID,
        isLastRead: this.lastReadMessageID === m.messageID,
        isFirst: index === 0,
        hideActions: this.hideActions,
        hideReactions: this.hideReactions,
        hidePinning: this.hidePinning,
        hideBookmarking: this.hideBookmarking,
        hideActionGoToMessage: this.hideActionGoToMessage,
        hideActionOpenThread: this.hideActionOpenThread,
        hideActionsMenu: this.hideActionsMenu,
        isLast: index === this.messages.length - 1,
        highlightPinned: this.highlightPinned,
        highlightBookmarked: this.highlightBookmarked,
      }))
    },
    getLastEditable () {
      return this.editLastMessage && this.getLastMessageByUserID(this.messages, this.currentUser.userID)
    },

    showEditor () {
      return ({ messageID }) => this.getLastEditable && this.getLastEditable.messageID === messageID
    },
  },

  watch: {
    'origin' () {
      this.originChanged()
    },
  },

  mounted () {
    this.originChanged()
  },

  updated () {
    const lastMessage = this.messages.length === 0 ? null : this.messages[this.messages.length - 1]
    const isNewMessage = lastMessage && this.lastMessageID < lastMessage.messageID

    if (isNewMessage) {
      // Store this for next lookup
      this.lastMessageID = lastMessage.messageID
    }
  },

  methods: {
    onTop ({ lastViewPool }) {
      if (!lastViewPool) {
        this.showGoToLast = true
      }
    },
    onBottom ({ lastViewPool }) {
      if (lastViewPool) {
        this.showGoToLast = false
      }
    },
    onScrollBottom () {
      this.firstOutOfView = undefined

      const lastMessage = this.messages.length === 0 ? null : this.messages[this.messages.length - 1]
      const isNewMessage = lastMessage && this.lastMessageID < lastMessage.messageID
      if (isNewMessage) {
        this.$emit('scrollBottom', { messageID: getLastID(this.messages) })
      }
    },

    gotoItem (item = {}) {
      if (this.$refs.chatScroller.gotoItem(item) === true) {
        this.showGoToLast = false
      }
    },

    // @todo
    alertNew (e) {
      // return
      // if (this.firstOutOfView !== undefined) return
      // console.debug('alertNew', { e })
      // this.firstOutOfView = e
    },

    isConsecutive,

    originChanged () {
      this.allowAutoScroll = true
    },

    // When we receive a request to mark message as unread
    // we want to find a previous message and mark that one as last read
    markAsUnread (index) {
      if (index === 0 || typeof this.origin !== 'object') {
        return
      }

      const { messageID, channelID, replyTo } = this.messages[index - 1]
      let payload = {
        channelID,
        messageID,
      }

      switch (this.origin.constructor.name) {
        case 'Message':
          payload.threadID = replyTo || messageID
          break
        case 'Channel':
          break
        default:
          return
      }

      this.$bus.$emit('message.markAsLastRead', payload)
    },

    getLastMessageByUserID: (set, userID) => {
      return [...set].reverse().find(m => m.userID === userID)
    },
  },
}

</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

.dynamic-scroller {
  height: 100%;
  padding-bottom: 10px;
}

.messages-wrapper {
  height: 100%;
  position: relative;
}

.msg {
  min-height: 30px;
}
ul {
  padding:0;
  margin:0;
}

li {
  list-style: none;
}

.scrollable {
  height: calc(100vh - 90px);
  overflow-x: hidden;
  overflow-y: scroll;
}

.alert-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
  transform: translateY(100%);

  &.visible {
    transform: translateY(0%);
  }

  &.go-down button {
    background-color: $appblue;
    padding: 3px;
    border: none;
    outline: none;
    width: 100%;
    color: $appwhite;
    padding: 5px;
  }
}
//media query specific for webkit, because of fixed and vh related problem in android/webkit
@media (max-width: #{$wideminwidth - 1px})
{
  .scrollable {
    //@support for webkit only
    @supports (-webkit-appearance:none) {
      //see : https://developers.google.com/web/updates/2016/12/url-bar-resizing
      //and : https://dev.to/peiche/100vh-behavior-on-chrome-2hm8
      //bottom:50px;
      //background-color:blue;
    }
  }
}
@media (min-width: $wideminwidth)
{
  .scrollable {
    height: calc(100vh - 135px);
  }
}
</style>
