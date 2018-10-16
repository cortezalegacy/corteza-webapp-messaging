<template>
  <div class="history">
    <ul class="discussion"
      v-if="ch"
      v-chat-scroll="{ always: false }"
      ref="msgList">
      <li class="crust_iam_main__message"
        v-for="msg in this.messages"
        :key="msg.ID">
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
            'message',
            'crust_iam_main__message__content',
            { from_me: (msg.user || {}).ID === user.ID }
          ]">
          <attachment  class="message-content" v-bind:msg="msg" v-if="msg.attachment"></attachment>
          <history-message :id="msg.id" class="message-content" v-else :chunks="processMsg(msg.message)"/>
        </p>
      </li>
    </ul>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import * as moment from 'moment'
import Attachment from './Attachment'
import HistoryMessage from '@/components/Channel/HistoryMessage'
import { Message } from '@/types'
import Avatar from '@/components/Avatar'
import triggers from '@/plugins/triggers'

export default {
  name: 'channel-history',
  data () {
    return {
      messages: [],
    }
  },

  resetUnreadTimeout: null,

  computed: {
    ...mapGetters({
      ch: 'channels/current',
      users: 'users/list',
      user: 'auth/user',

      findUserByID: 'users/findByID',
      findChannelByID: 'channels/findByID',
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
      incUnreadMessageCount: 'channels/incUnreadMessageCount',
      resetUnreadMessageCount: 'channels/resetUnreadMessageCount',
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
        // Received message for another chan, just increase msg counter
        this.incUnreadMessageCount(message.channelID)
        return
      }

      // Replaces given msg due to an update
      let n = this.messages.findIndex(m => m.ID === message.ID)
      // Doesn't yet exist -- add it
      if (n < 0) {
        // Push msg to either top or back
        // Check timestamp to determine where in array to push it to
        if (this.messages.length && moment(message.createdAt).isSameOrBefore(moment(this.messages[0].createdAt))) {
          this.messages.unshift(message)
        } else {
          this.messages.push(message)
        }
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

    scrollHandler (e) {
      let { target } = e
      if (target && this.isScrolledToTop(target)) {
        // Scrolled to top
        this.$ws.getMessages(this.ch.ID, this.getFirstMsgId)
      }

      if (target && this.isScrolledToBottom(target)) {
        // Scrolled to bottom
        // this.$ws.getMessages(this.ch.ID, undefined, this.getLastMsgId)
        this.$ws.recordChannelView(this.ch.ID, this.getLastMsgId)
      }
    },

    processMsg (msg) {
      return triggers.parse(msg.trim().split(/[ \n]/), this.findUserByID, this.findChannelByID)
    },

    resetUnreadAfterTimeout () {
      if (this.resetUnreadTimeout !== null) {
        window.clearTimeout(this.resetUnreadTimeout)
      }

      this.resetUnreadTimeout = window.setTimeout(() => {
        this.resetUnreadMessageCount(this.ch.ID)
        this.$ws.recordChannelView(this.ch.ID, this.getLastMsgId)
      }, 1000)
    },
  },

  watch: {
    'ch' (newV, oldV = {}) {
      if (newV && newV.ID !== oldV.ID) {
        this.messages = []

        this.$ws.getMessages(newV.ID)

        this.resetUnreadAfterTimeout()
      }
    },
  },

  beforeCreate () {
    this.$ws.subscribe('messages', (messages) => {
      // Slight scroll from edges to keep it from resetting to top/bottom
      let target = this.$refs.msgList
      if (target && this.isScrolledToTop(target)) {
        target.scrollTop = 1
      } else if (target && this.isScrolledToBottom(target)) {
        target.scrollTop -= 1
      }

      messages.forEach((message) => {
        this.addMessage(new Message(message))
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

    this.$nextTick(() => {
      if (this.$refs.msgList) {
        this.$refs.msgList.addEventListener('scroll', (e) => { this.scrollHandler(e) })
      }
    })

    this.resetUnreadAfterTimeout()
  },

  components: {
    Attachment,
    HistoryMessage,
    Avatar,
  },
}

</script>

<!-- this does not work in scoped... -->
<!-- no clue why, in any case should not break anything -->
<style>
  img
  {
    max-width: 100% !important;
    width:auto;
    max-height: 180px !important;
  }
</style>


<style scoped lang="scss">
  .discussion
  {
    position:relative;
    list-style:none;
    max-height:100%;
    overflow-x: hidden;
    overflow-y: auto;
    padding:0 20px;
    margin:0;
  }
  .avatar
  {
    position:absolute;
    left:0;
    top:0;
  }
  .discussion
  {
    .message
    {
      position:relative;
      word-wrap: break-word;
      .message-content
      {
        font-size:14px;
        pre
        {
          max-width:100%;
          overflow:scroll;
        }
      }
    }
  }
</style>
