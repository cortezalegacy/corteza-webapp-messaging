<template>
  <div class="history">
    <ul class="discussion"
      v-if="ch"
      v-chat-scroll="{ always: false }"
      ref="msgList">
      <li class="crust_iam_main__message"
        v-for="msg in this.messages"
        :key="msg.id">
        <section class="crust_iam_main__message__metas"
          :data-msg-user-id="msg.user?msg.user.ID:'no-uid'"
          :data-current-user-id="user.id">
          <avatar :user="msg.user" />
          <em class="crust_iam_main__message__meta-author">{{
            msg.user ? ( msg.user.name || msg.user.username || msg.user.ID )
            : 'Anonymous coward'
          }}</em>
          <span class="crust_iam_main__message__meta-date">
            {{ moment(msg.createdAt).fromNow() }}
          </span>
          <em
            v-if="isToday(msg.createdAt)"
            class="crust_iam_main__message__meta-time">
            {{ momentHourMinute(msg.createdAt) }}
          </em>
          <em v-else class="crust_iam_main__message__meta-time">{{ momentDayMonth(msg.createdAt) }}</em>
        </section>
        <!--
          @darh
          i don't know why user.id and msg.userid are
          not the same size, so i compared what i found to be common root
          ie : the first 14 chars.
        -->
        <p
          :id="msg.id"
          :class="[
            'crust_iam_main__message__content',
            { from_me: user && msg.user && (msg.user.ID.toString().substring(0,14) === user.id.toString().substring(0,14)) }
          ]">
            <attachment v-bind:msg="msg" v-if="msg.attachment"></attachment>
            <span v-else class="crust_iam_main__message__content-wrap">{{msg.message}}</span>
          </p>
      </li>
    </ul>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import * as moment from 'moment'
import Attachment from './Attachment'
import { Message } from '@/types'
import Avatar from '@/components/Avatar'

export default {
  name: 'channel-history',
  data () {
    return {
      messages: [],
    }
  },

  computed: {
    ...mapGetters({
      ch: 'channels/current',
      users: 'users/list',
      user: 'auth/user',
    }),

    getFirstMsgId () {
      return (this.messages[0] || {}).ID
    },

    getLastMsgId () {
      return (this.messages[this.messages.length - 1] || {}).ID
    },
  },

  methods: {
    ...mapActions({
      setLastMessageId: 'channels/setLastMessageId',
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
      if (this.ch && message.channelID !== this.ch.ID) return

      // Push msg to either top or back
      // Check timestamp to determine where in array to push it to
      if (this.messages.length && moment(message.createdAt).isSameOrBefore(moment(this.messages[0].createdAt))) {
        this.messages.unshift(message)
      } else {
        this.messages.push(message)
      }

      // Replaces given msg due to an update
      let n = this.messages.findIndex(m => m.ID === message.ID)
      if (n < 0) {
        this.messages.push(message)
      } else {
        this.messages.splice(n, 1, message)
      }
    },

    isScrolledToTop (target) {
      return target ? target.scrollTop <= 0 : true
    },

    isScrolledToBottom (target) {
      return target.scrollHeight - target.scrollTop - target.clientHeight <= 0
    },

    scrollHandeler (e) {
      let { target } = e
      if (this.isScrolledToTop(target)) {
        // Scrolled to top
        this.$ws.getMessages(this.ch.ID, this.getFirstMsgId)
      }

      if (this.isScrolledToBottom(target)) {
        // Scrolled to bottom
        // this.$ws.getMessages(this.ch.ID, undefined, this.getLastMsgId)
      }
    },
  },

  watch: {
    'ch' (newV, oldV = {}) {
      if (newV && newV.ID !== oldV.ID) {
        this.messages = []

        this.$ws.getMessages(newV.ID)
      }
    },
  },

  beforeCreate () {
    this.$ws.subscribe('messages', (messages) => {
      // Slight scroll from edges to keep it from resetting to top/bottom
      let target = this.$refs.msgList
      if (target !== undefined) {
        if (this.isScrolledToTop(target)) {
          target.scrollTop = 1
        } else if (this.isScrolledToBottom(target)) {
          target.scrollTop -= 1
        }
        messages.forEach((message) => {
          this.addMessage(new Message(message))
        })

        messages.forEach(m => {
          this.setLastMessageId({ channelID: m.channelID, messageId: m.ID })
        })
      }
    })

    this.$ws.subscribe('message', (message) => {
      this.addMessage(new Message(message))
    })
  },

  mounted () {
    if (this.ch) {
      this.$ws.getMessages(this.ch.ID)
    }

    this.$nextTick(() => {
      this.$refs.msgList.addEventListener('scroll', (e) => { this.scrollHandeler(e) })
    })
  },

  components: {
    Attachment,
    Avatar,
  },
}

</script>

<style scoped lang="scss">
  .discussion
  {
    list-style:none;
    max-height:100%;
    overflow:hidden auto;
    padding:0 20px;
    margin:0;
  }
  .avatar
  {
    position:absolute;
    left:0;
    top:0;
  }
</style>
