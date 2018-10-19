<template>
    <li
      class="message-n-meta"
      :class="{
        'continued': continued,
        'attachement' : message.attachment,
        'valid' : message.attachment && message.attachment.size > 0
      }"
      ref="message"
      :key="message.ID">
      <section>
        <em v-if="!continued" class="avatar">
          <avatar :user="message.user" />
        </em>
        <em  v-if="!continued" class="author">{{ message.user | userLabel }}</em>
        <span class="date">
            {{ moment(message.createdAt).fromNow() }}
            <span v-if="!isToday(message.createdAt)">at {{ momentHourMinute(message.createdAt) }}</span>
          </span>
        <em class="time">{{ momentHourMinute(message.createdAt) }}</em>
        <em class="day">{{ momentDayMonth(message.createdAt) }}</em>
        <div class="actions">
          <i class="action icon-message-circle-left-speak"></i>
          <i class="action icon-bubbles3"></i>
        </div>
      </section>
      <div
        class="message"
        :class="{ from_me: (message.user || {}).ID === currentUser.ID }">
        <attachment
          v-if="message.attachment"
          class="message-content"
          :attachment="message.attachment"
          :inline="message.type === 'inlineImage'" />
        <contents
          v-else
          class="message-content"
          :chunks="parse(message.message)" />
      </div>
      <div v-if="message.replies">{{message.replies}} replies</div>
    </li>
</template>
<script>
import * as moment from 'moment'
import Attachment from './Attachment'
import Contents from './Contents'
import Avatar from '@/components/Avatar'

export default {
  props: [
    'message',
    'continued',
    'currentUser',
  ],

  data () {
    return {
      loadSuspended: false,
      previousMessageCount: -1,
      allowAutoScroll: true,
      scrollToRef: false,
      resetUnreadTimeout: null,
    }
  },

  methods: {
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

    parse (text) {
      // @todo, find*byID should be bonded with triggers on load time
      return this.$triggers.parse(text.trim().split(/[ \n]/))
    },
  },

  components: {
    Attachment,
    Contents,
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
.message-n-meta
{
  position:relative;
  padding-left:50px;
  position:relative;
  padding:3px 23px 24px 65px;
  min-height:75px;
  background:url(../../../assets/images/vertical-dots.svg) no-repeat 35px 58px;
  background-size: auto 15px;
  &.continued
  {
    padding:3px 23px 4px 65px;
    margin-top:-20px;
    background:none;
    min-height:65px;
    &.attachement
    {
      margin-bottom:20px; // because attachements are bigger than 65px;
    }
    .message:before
    {
      display: none !important;
    }
  }
}
.author, .date, .time, .day
{
  font-style:normal;
  color:$appgrey;
  font-size:12px;
}
.avatar
{
  display:inline-block;
  position:absolute;
  left:20px;
  top:10px;
}
.author, .date
{
  display:inline-block;
  padding:2px 0.5em;
  //margin:2px 0;
}
.time, .day
{
  position:absolute;
  left:20px;
  top:45px;
}
.time
{
  display:none;
}
.continued
{
  .time
  {
    top:18px;
  }
  .day
  {
    display:none;
  }
}
.written-today
{
  .time
  {
    display:block;
  }
  .day
  {
    display:none;
  }
}
.written-today.continued
{
  .time
  {
    display:none;
  }
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
  }
  .actions
  {
    position:absolute;
    border-radius:3px;
    width:100%;
    left:0px;
    text-align: right;
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
      font-size:18px;
      text-align:center;
      box-shadow: 0 0 5px 0 rgba($appgrey,0.5);
    }
  }
}
.message-n-meta.continued:hover,
.message-n-meta.continued:focus
{
  .date
  {
    display:none;
  }
  .time
  {
    display:block;
  }
}
.message
{
  position:relative;
  display:table;
  background-color:$messagebgcolor;
  word-wrap: break-word;
  border-radius:3px;
  padding:10px;
  margin-top:2px;

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
    font-size:16px;
    pre
    {
      max-width:100%;
      overflow:scroll;
      font-size:12px;
    }
  }
}

@media (min-width: $wideminwidth)
{
  .actions
  {
    transform: translateX(-50%);
  }
}
</style>
