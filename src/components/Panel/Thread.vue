<template>
  <aside
    v-if="repliesTo"
    class="menu-layer right thread">
    <channel-upload v-if="channel"
      :channelID="channel.ID" :replyTo="repliesTo" ref="upload"></channel-upload>
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
      @editMessage="onEditMessage"
      @deleteMessage="onDeleteMessage"
      v-on="$listeners" />

    <channel-input
      ref="replyInput"
      @submit="onInputSubmit"
      @promptFilePicker="onOpenFilePicker"
      @editLastMessage="onEditLastMessage" />
  </aside>
</template>
<script>
import { mapActions, mapGetters } from 'vuex'
import Messages from '@/components/Messages'
import { ChannelInput, ChannelUpload } from '@/components/Channel'
import messages from '@/mixins/messages'

export default {
  props: {
    repliesTo: {
      type: String,
      required: true,
    },

    channel: {
      type: Object,
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
    }),

    messages () {
      return this.getThread(this.repliesTo)
    },
  },

  methods: {
    ...mapActions({
      toggleUserPanel: 'ui/toggleUserPanel',
    }),

    // Preloads all thread data
    preload () {
      this.$ws.getReplies(this.repliesTo)
    },

    setEditMessage (message) {
      this.$refs.replyInput.setValue(message.message, message)
    },

    onInputSubmit ({ value, meta }) {
      // @todo this is standard submit handling... move it to a common place (plugin, mixin...)

      if (value.length > 1 && value[0] === '/') {
        if (!this.execLocal(value)) {
          const i = value.indexOf(' ')
          if (i < 1) {
            return
          }

          const command = value.substr(1, i - 1)
          const input = value.substr(i + 1)

          console.debug('Executing a command', { command, input })
          this.$ws.exec(this.channelID, command, {}, input)
        }
      } else if (meta && meta.ID && meta.length === 0) {
        this.$ws.deleteMessage(meta.ID)
      } else if (meta && meta.ID) {
        this.$ws.updateMessage(meta.ID, value)
      } else {
        this.$ws.sendReply(this.repliesTo, value)
      }
    },

    onDeleteMessage ({ message }) {
      if (confirm('Delete this message?')) {
        this.$ws.deleteMessage(message.ID)
      }
    },

    onEditMessage ({ message }) {
      this.setEditMessage(message)
    },

    // Find last editable message
    onEditLastMessage (ev) {
      const lastReply = [...this.messages].reverse().find(m => m.canEdit(this.currentUser))

      // Ask history component about last editable message
      if (lastReply) {
        this.setEditMessage(lastReply)
      }
    },

    onOpenFilePicker () {
      this.$refs.upload.openFilePicker()
    },
  },

  components: {
    ChannelInput,
    ChannelUpload,
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
  min-height:67px;
  padding:15px;
  background-color: $appcream;
  border-bottom:dotted 1px rgba($appgrey,0.5);
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
}
.channel-input
{
  position: absolute;
  border-width: 5px 15px 5px 15px;
  display:table;
  bottom:0;
}

</style>
