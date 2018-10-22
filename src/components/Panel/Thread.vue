<template>
  <aside
    v-if="repliesTo && originalMessage"
    class="menu-layer right thread">
    <channel-upload v-if="channel"
      :channelID="channel.ID" :replyTo="repliesTo" ref="upload"></channel-upload>

    <label class="closer"
           @click="$emit('close')"
           aria-label="Close"><i class="icon-close"></i></label>

    <message ref="original"
             :message="originalMessage"
             hide-action-open-thread="true"
             :current-user="user" />

    <message v-for="(msg, index) in replies"
             v-on="$listeners"
             ref="message"
             :message="msg"
             :continued="isContinued(replies, index)"
             :current-user="user"
             :key="msg.ID" />

    <channel-input
      ref="replyInput"
      @submit="onInputSubmit"
      @promptFilePicker="openFilePicker"
      @editLast="editLastMessage" />
  </aside>
</template>
<script>
import { mapActions, mapGetters } from 'vuex'
import Message from '@/components/History/Message'
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
      console.log('repliesTo', newRepliesTo, oldRepliesTo)
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
      user: 'auth/user',
      getMessageByID: 'history/getByID',
      getRepliesByID: 'history/getRepliesByID',
      isUserPanelOpen: 'ui/isUserPanelOpen',
    }),

    originalMessage () { return this.getMessageByID(this.repliesTo) },
    replies () { return this.getRepliesByID(this.repliesTo) },
  },

  methods: {
    ...mapActions({
      toggleUserPanel: 'ui/toggleUserPanel',
    }),

    // Preloads all thread data
    preload () {
      console.debug('Loading new thread', { rt: this.repliesTo })
      this.$ws.getReplies(this.repliesTo)
    },

    openFilePicker () {
      this.$refs.upload.openFilePicker()
    },

    onInputSubmit (e) {
      // @todo this is standard submit handling... move it to a common place (plugin, mixin...)
      const { message, meta } = e

      if (message.length > 1 && message[0] === '/') {
        if (!this.execLocal(message)) {
          const i = message.indexOf(' ')
          if (i < 1) {
            return
          }

          const command = message.substr(1, i - 1)
          const input = message.substr(i + 1)

          console.debug('Executing a command', { command, input })
          this.$ws.exec(this.channelID, command, {}, input)
        }
      } else if (meta.ID && message.length === 0) {
        console.debug('Delete message [DISABLED UNTIL FIXED!]', { ID: meta.ID })
        // this.$ws.deleteMessage(meta.ID)
      } else if (meta.ID) {
        console.debug('Sending message update [DISABLED UNTIL FIXED!]', { message, ID: meta.ID })
        // this.$ws.updateMessage(meta.ID, message)
      } else {
        console.debug('Sending new message', { message, repliesTo: this.repliesTo })
        this.$ws.sendReply(this.repliesTo, message)
      }
    },

    setEditMessage (msg = {}) {
      console.warn('Message editing disabled until fixed', msg)
      // let { message, ID } = msg || {}
      // this.$refs.channelInput.setValue(message, { ID })
    },

    editLastMessage () {
      // Ask history component about last editable message
      // @todo
    },
  },

  components: {
    ChannelInput,
    Message,
    ChannelUpload,
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
  position: fixed;
  top: 5px;
  right: 20px;
  font-size: 20px;
}
</style>
