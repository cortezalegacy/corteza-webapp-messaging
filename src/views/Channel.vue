<template>
  <section
    v-if="channel"
    :class="{ 'unread-messages': unread(channelID) }"
    @dragover="showUploadArea=true"
    @dragenter="showUploadArea=true">

    <upload
      v-show="showUploadArea"
      @close="showUploadArea=false"
      @show="showUploadArea=true"
      :channelID="channel.ID"
      ref="upload" />

    <channel-header
      v-on="$listeners"
      :channel="channel"></channel-header>

    <messages
      class="messages"
      ref="messages"
      :messages="messages"
      :currentUser="currentUser"
      :origin="channel"
      :scrollable="true"
      :lastReadMessageID="lastUnreadMessageInChannel(channelID)"
      :editLastMessage="editLastMessage"
      @cancelEditing="editLastMessage=false"
      @scrollTop="onScrollTop"
      @scrollBottom="onScrollBottom"
      v-on="$listeners" />

    <observer-footer
      v-if="!isMember"
      :channel="channel" />

    <message-input
      :channel="channel"
      v-if="isMember"
      @promptFilePicker="onOpenFilePicker"
      @editLastMessage="editLastMessage=true" />

    <activity
      v-if="isMember"
      :users="activeInChannel(channelID, 'typing')">typing</activity>

  </section>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import ChannelHeader from '@/components/Channel/Header'
import ObserverFooter from '@/components/Channel/ObserverFooter'
import MessageInput from '@/components/MessageInput'
import Upload from '@/components/MessageInput/Upload'
import Messages from '@/components/Messages'
import Activity from '@/components/Activity'

export default {
  props: {
    channelID: {
      type: String,
      required: true,
    },

    messageID: {
      // go-to-message will fill this prop.
      type: String,
    },
  },

  computed: {
    ...mapGetters({
      channelByID: 'channels/findByID',

      unread: 'unread/channel',
      lastUnreadMessageInChannel: 'unread/lastMessageInChannel',

      user: 'auth/user',
      currentUser: 'auth/user',

      activeInChannel: 'users/activeInChannel',

      channelHistory: 'history/getByChannelID',
    }),

    messages () {
      return this.channelHistory(this.channel.ID)
    },

    currentChannel () {
      return this.channelByID(this.channelID)
    },

    isMember () {
      return this.channel.isMember(this.user.ID)
    },
  },

  data () {
    return {
      showUploadArea: false,

      resetUnreadTimeout: null,
      channel: null,

      // Assists with on-scroll loading
      previousFetchFirstMessageID: null,

      // Controls if last message in the list
      // should be have editing enabled or not
      editLastMessage: false,
    }
  },

  watch: {
    currentChannel: {
      handler: function () {
        this.changeChannel(this.currentChannel)
      },
      deep: true,
    },
  },

  created () {
    let c = this.currentChannel
    if (!c) return

    this.changeChannel(c)
  },

  methods: {
    ...mapActions({
      clearHistory: 'history/clear',
      setCurrentChannel: 'channels/setCurrent',
      setChannelUnreadCount: 'unread/setChannel',
      ignoreChannelUnreadCount: 'unread/ignoreChannel',
      unignoreChannelUnreadCount: 'unread/unignoreChannel',
    }),

    changeChannel (channel) {
      if (!channel) return

      this.editLastMessage = false
      this.channel = channel

      this.setCurrentChannel(this.channel)

      this.previousFetchFirstMessageID = null

      this.ignoreChannelUnreadCount(this.channel.ID)

      // @todo <fromID> does not work as expected
      // need to rewire message fetching via rest and react
      // after response is actually received
      this.$ws.getMessages({ channelID: this.channel.ID, fromID: this.messageID })
    },

    resetUnreadAfterTimeout (lastMessageID) {
      this.clearUnreadTimeout()

      this.resetUnreadTimeout = window.setTimeout(() => {
        this.setChannelUnreadCount({ ID: this.channel.ID, count: 0, lastMessageID })
        this.$ws.recordChannelView(this.channel.ID, lastMessageID)
      }, 2000)
    },

    clearUnreadTimeout () {
      if (this.resetUnreadTimeout !== null) {
        window.clearTimeout(this.resetUnreadTimeout)
      }
    },

    onOpenFilePicker () {
      this.$refs.upload.openFilePicker()
    },

    onScrollTop ({ messageID }) {
      if (this.previousFetchFirstMessageID !== messageID) {
        // Make sure we do not fetch for the same lastID
        // over and over again...
        this.previousFetchFirstMessageID = messageID

        this.$ws.getMessages({
          channelID: this.channel.ID,
          lastID: messageID,
        })
      }
    },

    onScrollBottom ({ messageID }) {
      if (document.hasFocus()) {
        this.resetUnreadAfterTimeout(messageID)
      } else {
        const resetUnreadAfterTimeoutOnFocus = () => {
          this.resetUnreadAfterTimeout(messageID)
          window.removeEventListener('focus', resetUnreadAfterTimeoutOnFocus)
        }
        window.addEventListener('focus', resetUnreadAfterTimeoutOnFocus)
      }
    },
  },

  components: {
    Messages,
    MessageInput,
    Upload,
    ChannelHeader,
    Activity,
    ObserverFooter,
  },
}
</script>

<style lang="scss" scoped>
@import '@/assets/sass/_0.commons.scss';
//disposition of elements is done here:
.header,
.channel-input,
.messages
{
  position: absolute;
  width:100%;
  max-width:100vw;
  left:0;
}
.header
{
  top:0;
}
.channel-input
{
  bottom:0;
}
.messages
{
  top:52px;
}

@media (min-width: $wideminwidth)
{
  .header,
  .channel-input,
  .messages
  {
    right:0;
  }
  .messages
  {
    top:62px;
    bottom:65px;
  }
}

footer {
  bottom: 0px;
  position: absolute;
}

section.activity {
  color: $appgrey;
  position: absolute;
  left: 65px;
  bottom: 5px;
}
</style>
