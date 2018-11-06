<template>
  <aside
    v-if="repliesTo"
    class="menu-layer right thread noborder">
    <upload v-if="channel && showUploadArea"
      :channelID="channel.ID" :replyTo="repliesTo" ref="upload" />

    <div class="thread-title">
      <strong class="panel-type">Thread</strong>
      <p class="channel-name-wrap">in <channel-name class="channel-name" :channel="channel"></channel-name></p>
      <label class="closer"
             @click="$emit('close')"
             aria-label="Close"><i class="icon-close"></i></label>
    </div>

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
      @submit="onInputSubmit"
      @promptFilePicker="onOpenFilePicker"
      @editLastMessage="editLastMessage=true" />
  </aside>
</template>
<script>
import { mapActions, mapGetters } from 'vuex'
import Messages from '@/components/Messages'
import MessageInput from '@/components/MessageInput'
import Upload from '@/components/MessageInput/Upload'
import messages from '@/mixins/messages'

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

      showUploadArea: true,
    }
  },

  methods: {
    ...mapActions({
      toggleUserPanel: 'ui/toggleUserPanel',
    }),

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
  },

  mixins: [
    messages,
  ],
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

.thread-title {
  position: absolute;
  min-height:60px;
  padding:10px;
  box-shadow: 0 0.1em 0.2em 0 rgba($defaulttextcolor, 0.1);
  margin-bottom:5px;
  top: 0px;
  width: 100%;
}

.channel-name-wrap
{
  white-space: nowrap;
  max-width:calc(100% - 30px);
  overflow:hidden;
  text-overflow:ellipsis;
  padding:0;
  margin:0;

  .channel-name:before
  {
    content:'#';
    display:inline-block;
    margin-right:2px;
  }
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
