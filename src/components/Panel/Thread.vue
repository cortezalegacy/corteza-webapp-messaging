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
             @editMessage="onEditMessage"
             @deleteMessage="onDeleteMessage"
             :message="originalMessage"
             :hide-action-open-thread="true"
             :current-user="user" />

    <message v-for="(msg, index) in replies"
             v-on="$listeners"
             @editMessage="onEditMessage"
             @deleteMessage="onDeleteMessage"
             ref="message"
             :message="msg"
             :continued="isContinued(replies, index)"
             :current-user="user"
             :key="msg.ID" />

    <channel-input
      ref="replyInput"
      @submit="onInputSubmit"
      @promptFilePicker="onOpenFilePicker"
      @editLastMessage="onEditLastMessage" />
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

    setEditMessage ({ message, ID }) {
      this.$refs.replyInput.setValue(message, { ID })
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
        this.$ws.deleteMessage(meta.ID)
      } else if (meta.ID) {
        this.$ws.updateMessage(meta.ID, message)
      } else {
        console.debug('Sending new message', { message, repliesTo: this.repliesTo })
        this.$ws.sendReply(this.repliesTo, message)
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
      const lastReply = [...this.replies].reverse().find(m => m.canEdit(this.user))

      // Ask history component about last editable message
      if (lastReply) {
        this.setEditMessage(lastReply)
      } else {
        this.setEditMessage(this.originalMessage)
      }
    },

    onOpenFilePicker () {
      this.$refs.upload.openFilePicker()
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
