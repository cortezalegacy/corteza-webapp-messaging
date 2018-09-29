<template>
  <div class="crust_iam_messages_wrapper">
    <ul class="crust_iam_main__messages" v-if="ch" v-chat-scroll>
      <li class="crust_iam_main__message" v-for="msg in this.messages" :key="msg.ID">
        <section class="crust_iam_main__message__metas" :data-msg-user-id="msg.userId" :data-current-user-id="'id'+user.id">
          <i class="crust_profile-pic crust_iam_main__message__meta-avatar" :style="'background-image:url(/static/pics/user'+(msg.userId%10)+'.png)'"></i>
          <em class="crust_iam_main__message__meta-author">{{ msg.user ? (msg.user.name || msg.user.username || msg.user.ID) : 'Anonymous coward' }}</em>
          <span class="crust_iam_main__message__meta-date">{{ moment(msg.createdAt).fromNow() }}</span>
          <em v-if="isToday(msg.createdAt)" class="crust_iam_main__message__meta-time">{{ momentHourMinute(msg.createdAt) }}</em>
          <em v-else class="crust_iam_main__message__meta-time">{{ momentDayMonth(msg.createdAt) }}</em>
        </section>
         <!--i don't know why user.id and msg.userid are not the same size, so i compared what i found to be common root -->
        <!--(msg.user.ID.toString().substring(0,14) == user.id.toString().substring(0,14))-->

        <attachment v-bind:msg="msg" v-if="msg.attachment"></attachment>
        <p v-else :id="msg.id" :class="['crust_iam_main__message__content',{ from_me: false }]"><span class="crust_iam_main__message__content-wrap">{{msg.message}}</span></p>
      </li>
    </ul>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import * as moment from 'moment'
import Attachment from './Attachment'
import { Message } from '@/types'

export default {
  name: 'channel-history',
  data () {
    return {
      messages: []
    }
  },

  computed: {
    ...mapGetters({
      ch: 'messagingChannels/current',
      users: 'messagingUsers/list',
      user: 'auth/user'
    })
  },

  methods: {
    ...mapActions({
      setLastMessageId: 'messagingChannels/setLastMessageId'
    }),

    moment: function (timeString) {
      return moment(timeString)
    },
    momentDayMonth: function (timeString) {
      return moment(timeString).format('DD/MM')
    },
    momentHourMinute: function (timeString) {
      return moment(timeString).format('HH:mm')
    },
    isToday: function (timeString) {
      return (moment().startOf('day').unix() === moment(timeString).startOf('day').unix())
    },

    addMessage (message) {
      if (this.ch && message.channelID !== this.ch.ID) {
        return
      }

      let n = this.messages.findIndex(m => m.ID === message.ID)
      if (n < 0) {
        this.messages.push(message)
      } else {
        this.messages.splice(n, 1, message)
      }
    }
  },

  watch: {
    'ch' () {
      this.messages = []

      if (this.ch) {
        this.$ws.getMessages(this.ch.ID)
      }
    }
  },

  beforeCreate () {
    this.$ws.subscribe('messages', (messages) => {
      messages.reverse().forEach((message) => {
        this.addMessage(new Message(message))
      })

      messages.reverse().forEach(m => {
        this.setLastMessageId({channelID: m.channelID, messageId: m.ID})
      })
    })

    this.$ws.subscribe('message', (message) => {
      this.addMessage(new Message(message))
    })
  },

  mounted () {
    if (this.ch) {
      this.$ws.getMessages(this.ch.ID)
    }
  },

  components: {
    Attachment
  }
}

</script>

<style scoped>

</style>
