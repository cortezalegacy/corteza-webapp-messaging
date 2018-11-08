<template>
  <base-panel
    v-on="$listeners"
    @dragover="showUploadArea=true"
    @dragenter="showUploadArea=true">

    <template slot="header">Thread</template>
    <template slot="subtitle">in <channel-name class="channel-name" :channel="channel"></channel-name></template>
    <template slot="main">
      <upload v-show="channel && showUploadArea"
        @close="showUploadArea=false"
        @show="showUploadArea=true"
        :channelID="channel.ID"
        :replyTo="repliesTo"
        ref="upload" />

      <messages
        class="messages"
        ref="messages"
        :messages="messages"
        :currentUser="currentUser"
        :origin="channel"
        :scrollable="true"
        :hideActionOpenThread="true"
        :editLastMessage="editLastMessage"
        @cancelEditing="editLastMessage=false"
        v-on="$listeners" />

      <message-input
        :replyTo="message"
        @promptFilePicker="onOpenFilePicker"
        @editLastMessage="editLastMessage=true" />
    </template>
  </base-panel>
</template>
<script>
import { mapGetters } from 'vuex'
import BasePanel from './'
import Messages from '@/components/Messages'
import MessageInput from '@/components/MessageInput'
import Upload from '@/components/MessageInput/Upload'

export default {
  props: {
    repliesTo: {
      type: String,
      required: true,
    },
  },

  watch: {
    repliesTo (newRepliesTo, oldRepliesTo) {
      if (newRepliesTo && newRepliesTo !== oldRepliesTo) {
        this.preload()
      }
    },
  },

  created () {
    this.preload()
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
      getMessageByID: 'history/getByID',
      getThread: 'history/getThread',
      getChannelByID: 'channels/findByID',
    }),

    message () {
      return this.getMessageByID(this.repliesTo)
    },

    channelID () {
      return this.message.channelID
    },

    channel () {
      return this.getChannelByID(this.channelID) || {}
    },

    messages () {
      return this.getThread(this.repliesTo)
    },
  },

  data () {
    return {
      // Controls if last message in the list
      // should be have editing enabled or not
      editLastMessage: false,

      showUploadArea: false,
    }
  },

  methods: {
    // Preloads all thread data
    preload () {
      this.$ws.getReplies(this.repliesTo)
    },

    onOpenFilePicker () {
      this.$refs.upload.openFilePicker()
    },
  },

  components: {
    MessageInput,
    Upload,
    Messages,
    BasePanel,
  },
}
</script>

<style scoped lang="scss">
//inlude generic definitions
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/menu-layer.scss';

.closer {
  position: absolute;
  top: 5px;
  right: 20px;
  font-size: 20px;
  z-index: 9999;
}

.thread
{
  overflow: hidden;
  margin-top:0;
  padding-top:0;
  height: 100vh;
}

.messages {
  position: absolute;
  top: 72px;
  height: calc(100vh - 147px);
  padding-top:20px;
}
.channel-input
{
  position: absolute;
  border-width: 5px 15px 5px 15px;
  display:table;
  bottom:0;
  background-color:$appwhite;
  border-color:$appwhite;
}

</style>
