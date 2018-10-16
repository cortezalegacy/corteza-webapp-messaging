<template>
  <div class="history">
    <ul class="discussion"
      v-if="ch"
      v-chat-scroll="{ always: false }"
      ref="msgList">
      <li class="message-n-meta"
        v-for="msg in this.messages"
        :key="msg.ID">
        <section class="metas"
          :data-msg-user-id="msg.user?msg.user.ID:'no-uid'"
          :data-current-user-id="user.id">
          <avatar :user="msg.user" />
          <em class="author">
            {{ msg.user ? ( msg.user.name || msg.user.username || msg.user.ID ) : 'Anonymous coward' }}
          </em>
          <span class="date">
            {{ moment(msg.createdAt).fromNow() }}
            <span v-if="!isToday(msg.createdAt)">at {{ momentHourMinute(msg.createdAt) }}</span>
          </span>
          <em
            v-if="isToday(msg.createdAt)"
            class="time">
              {{ momentHourMinute(msg.createdAt) }}
          </em>
          <em
            v-else
            class="time">
              {{ momentDayMonth(msg.createdAt) }}
          </em>
          <div class="actions">
            <i class="action icon-message-circle-left-speak"></i>
            <i class="action icon-bubbles3"></i>
          </div>
        </section>

         <!--
          @darh
          i don't know why user.id and msg.userid are
          not the same size, so i compared what i found to be common root
          ie : the first 14 chars.
        -->
        <div
          :id="msg.id"
          :class="[
            'message',
            { from_me: (msg.user || {}).ID === user.ID }
          ]">
          <attachment  class="message-content" v-bind:msg="msg" v-if="msg.attachment"></attachment>
          <history-message :id="msg.id" class="message-content" v-else :chunks="processMsg(msg.message)"/>
        </div>
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
      loadSuspended: false,
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
      if (target && this.isScrolledToTop(target) && !this.loadSuspended) {
        // Scrolled to top
        this.loadSuspended = true
        this.$ws.getMessages(this.ch.ID, this.getFirstMsgId)
      }

      if (target && this.isScrolledToBottom(target) && !this.loadSuspended) {
        // Scrolled to bottom
        // this.loadSuspended = true
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
      this.loadSuspended = false

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
  @import '@/assets/sass/_0.commons.scss';
  .discussion
  {
    position:relative;
    list-style:none;
    max-height:100%;
    overflow-x: hidden;
    overflow-y: auto;
    padding:0;
    margin:0;
  }
  .avatar
  {
    position:absolute;
    left:20px;
    top:3px;
  }
  .message-n-meta
  {
    position:relative;
    padding-left:50px;
    position:relative;
    padding:3px 20px 23px 65px;
    min-height:75px;
    background:url(../../assets/images/vertical-dots.svg) no-repeat 35px 55px;
    background-size: auto 15px;
  }
  .author, .date, .time
  {
    font-style:normal;
    color:$appgrey;
    font-size:12px;
  }
  .time
  {
    position:absolute;
    left:20px;
    top:40px;
  }
  .date, .actions
  {
    display:none;
  }
  .message-n-meta:hover,
  .message-n-meta:focus
  {
    background-color:rgba($appgrey,0.1);
    .date
    {
      display:inline-block;
      padding:0 0.5em;
    }
    .actions
    {
      position:absolute;
      border-radius:3px;
      right:5px;
      top:-5px;
      display:inline-block;
      padding:0 0.5em;
      z-index:5;
      .action
      {
        display:inline-block;
        border:solid 1px rgba($appgrey,0.25);
        margin:0 5px;
        border-radius:30px;
        line-height:30px;
        width:30px;
        background-color:$appwhite;
        font-size:20px;
        text-align:center;
      }
    }
  }

  .message
  {
    position:relative;
    display:table;
    background-color:$messagebgcolor;
    word-wrap: break-word;
    border-radius:3px;
    padding:6px;

    // the little triangle on the left of message
    &:before
    {
      content:" ";
      background-color:$messagebgcolor;
      position:absolute;
      left:-5px;
      top:8px;
      width:10px;
      height:10px;
      transform:rotate(45deg);
    }

    // my messages in blue
    &.from_me
    {
      background-color:$currentmymessagebgcolor;
      span
      {
        background-color:$currentmymessagebgcolor;
      }
      &:before
      {
        background-color:$currentmymessagebgcolor;
      }
    }

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
</style>
