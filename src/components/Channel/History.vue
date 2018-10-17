<template>
  <div class="history">
    <ul class="discussion"
      v-if="ch"
      @scroll="scrollHandler"
      ref="msgList">
      <li class="message-n-meta"
        v-for="(msg) in this.messages"
        ref="message"
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
      <li ref="anchor" />
    </ul>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import * as moment from 'moment'
import Attachment from './Attachment'
import HistoryMessage from '@/components/Channel/HistoryMessage'
import Avatar from '@/components/Avatar'
import triggers from '@/plugins/triggers'

export default {
  name: 'channel-history',
  data () {
    return {
      loadSuspended: false,
      previousMessageCount: -1,
      allowAutoScroll: true,
      scrollToRef: null,
      resetUnreadTimeout: null,
    }
  },


  computed: {
    ...mapGetters({
      ch: 'channels/current',
      users: 'users/list',
      user: 'auth/user',

      findUserByID: 'users/findByID',
      findChannelByID: 'channels/findByID',

      getFirstMsgId: 'history/getFirstId',
      getLastMsgId: 'history/getLastId',
      messages: 'history/get',
    }),
  },

  methods: {
    ...mapActions({
      incChannelUnreadCount: 'unread/incChannel',
      setChannelUnreadCount: 'unread/setChannel',
      ignoreChannelUnreadCount: 'unread/ignoreChannel',
      unignoreChannelUnreadCount: 'unread/unignoreChannel',
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

    isScrolledToTop (target) {
      return target ? target.scrollTop <= 0 : true
    },

    isScrolledToBottom (target) {
      return target.scrollHeight - target.scrollTop - target.clientHeight <= 0
    },

    hasScrollbar () {
      return this.$refs.msgList.scrollHeight > this.$refs.msgList.clientHeight
    },

    scrollHandler (e) {
      if (this.$refs.message.length === 0) {
        // Do not do any auto scrolling when there are no messages
        return
      }

      let { target } = e

      this.allowAutoScroll = this.isScrolledToBottom(target)

      if (target && this.isScrolledToTop(target) && !this.loadSuspended) {
        // Suspend loading until DOM is updated
        this.loadSuspended = true

        // Scroll to earliest message we had before loading
        // any older messages, see updated()
        this.scrollToRef = this.$refs.message[this.$refs.message.length - 1]

        this.$ws.oldMessages(this.ch.ID, this.getFirstMsgId)
      }

      if (target && this.isScrolledToBottom(target) && !this.loadSuspended) {
        // this.loadSuspended = true
        // this.$ws.newMessages(this.ch.ID, undefined, this.getLastMsgId)
        this.$ws.recordChannelView(this.ch.ID, this.getLastMsgId)
      }

      if (this.allowAutoScroll) {
        this.resetUnreadAfterTimeout()
        this.ignoreChannelUnreadCount(this.ch.ID)
      } else {
        this.clearUnreadTimeout()
        this.unignoreChannelUnreadCount(this.ch.ID)
      }
    },

    processMsg (msg) {
      return triggers.parse(msg.trim().split(/[ \n]/), this.findUserByID, this.findChannelByID)
    },

    resetUnreadAfterTimeout () {
      this.clearUnreadTimeout()

      this.resetUnreadTimeout = window.setTimeout(() => {
        this.setChannelUnreadCount({ ID: this.ch.ID, count: 0 })
        this.$ws.recordChannelView(this.ch.ID, this.getLastMsgId)
      }, 2000)
    },

    clearUnreadTimeout () {
      if (this.resetUnreadTimeout !== null) {
        window.clearTimeout(this.resetUnreadTimeout)
      }
    },

    channelChanged () {
      this.ignoreChannelUnreadCount(this.ch.ID)
      this.previousMessageCount = -1
      this.loadSuspended = false
      this.allowAutoScroll = true
    },
  },

  watch: {
    'ch' (newV, oldV = {}) {
      if (newV && newV.ID !== oldV.ID) {
        this.channelChanged()
      }
    },
  },

  mounted () {
    this.channelChanged()
  },

  updated () {
    this.$nextTick(() => {
      if (!this.hasScrollbar()) {
        this.resetUnreadAfterTimeout()
        this.ignoreChannelUnreadCount(this.ch.ID)
      } else if (this.scrollToRef) {
        this.scrollToRef.scrollIntoView()
      } else if (this.allowAutoScroll) {
        this.$refs.anchor.scrollIntoView()
      }
    })

    // When length increased, remove suspension flag
    // and allow another load
    const l = this.messages.length
    if (l > this.previousMessageCount) {
      this.previousMessageCount = l
      this.loadSuspended = false
    }
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
