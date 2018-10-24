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
        <div class="actions" v-if="!hideActions">
          <!-- i class="action icon-message-circle-left-speak"></i -->
          <i class="action icon-message-circle-left-speak"
            title="Reply in thread"
            v-if="!message.replyTo && !hideActionOpenThread"
            @click="$emit('openThread', { message })"
          ></i>
          <i v-if="!contextMenu"
            class="action icon-plus" @click="contextMenu=!contextMenu"></i>
          <i v-else
            class="action icon-close" @click="contextMenu=!contextMenu"></i>
        </div>
        <div class="context-menu" v-if="contextMenu">
          <ul class="context-menu-list">
            <li v-if="!message.replyTo && !hideActionOpenThread"
                class="extra-action"
                @click="$emit('openThread', { message })">
                <i class="icon icon-message-circle-left-speak"></i>
                <span>Reply in thread</span>
            </li>
            <li v-if="message.canEdit(currentUser)"
                class="extra-action"
                @click="$emit('editMessage', { message })">
                <i class="icon icon-edit"></i>
                <span>edit message</span>
            </li>
            <!-- no use having the action if you can't do it -->
            <!-- li v-else
                class="disabled">
                edit message
            </li -->
            <li v-if="message.canDelete(currentUser)"
                class="extra-action"
                @click="$emit('deleteMessage', { message })">
                <i class="icon icon-trash"></i>
                <span>delete message</span>
            </li>
            <!-- no use having the action if you can't do it -->
            <!-- li v-else
                class="disabled">
                delete message
            </li -->
          </ul>
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
          :id="message.ID"
          :chunks="getChunks(message.message)" />
      </div>
      <div>
        <span v-if="message.replies">{{message.replies}} replies</span>
        <span v-if="message.updatedAt">edited</span>
      </div>
    </li>
</template>
<script>
import * as moment from 'moment'
import Attachment from './Attachment'
import Contents from './Contents'
import Avatar from '@/components/Avatar'

export default {
  props: {
    message: {
      type: Object,
      required: true,
    },
    continued: {
      type: Boolean,
      required: false,
    },
    currentUser: {
      type: Object,
      required: true,
    },
    hideActions: {
      type: Boolean,
      required: false,
    },
    hideActionOpenThread: {
      type: Boolean,
      required: false,
    },
  },

  data () {
    return {
      loadSuspended: false,
      previousMessageCount: -1,
      allowAutoScroll: true,
      scrollToRef: false,
      resetUnreadTimeout: null,
      contextMenu: false,
    }
  },

  methods: {
    isCurrentUser () {
      return (this.message.user || {}).ID === this.currentUser.ID
    },

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

    getChunks (text) {
      return this.$triggers.getChunks(text)
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
<style lang="scss">
  @import '@/assets/sass/_0.commons.scss';
  // @todo put those in generic file or resets ?
  img
  {
    max-width: 100% !important;
    width:auto;
    max-height: 180px !important;
  }

  /* reset mark styles */
  // marks do not work in scope either
  // @todo because they are in a function ?
  mark
  {
    background-color:rgba($appyellow, 0.25);
    display:inline-block;
    border-radius:1em;
    padding:1px 5px;
    margin:0 3px;
    b
    {
      font-weight:normal;
      margin-right:2px;
      display:inline-block;
    }
  }
  .channel-mark
  {
    background-color:rgba($appblue, 0.15);
  }
  .command-mark
  {
    background-color:rgba($appgrey, 0.15);
  }
  //if my own messages ligthen text to increase difference.
  .from_me
  {
    mark
    {
      background-color:rgba($appyellow, 1);
      color:black;
    }
    .channel-mark
    {
      background-color:rgba($appblue, 0.75);
      color:white;
    }
  }
  .spaced:first-child mark
  {
    margin-left:0;
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
.actions, .context-menu
{
  position:absolute;
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
  .actions, .context-menu
  {
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
      cursor:pointer;
    }
  }
  .context-menu
  {
    left:-30px;
    z-index:6;
    &:hover
    {
      display:block;
    }
    .context-menu-list
    {
      list-style:none;
      float:right;
      background-color:white;
      box-shadow:       0 0 5px 0 rgba($appgrey,0.5);
      border:           solid 1px rgba($appgrey,0.25);
      padding:0;
      margin:0;
      margin-top:-1px;
      .extra-action
      {
        padding:7px 10px;
        text-align:left;
        *
        {
          display:inline-block;
          line-height:18px;
          vertical-align:middle;
        }
        .icon
        {
          font-size:16px;
          margin-right:5px;
        }
        &:hover
        {
          background-color:$appcream;
          cursor: pointer;
        }
      }
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
  .actions, .context-menu
  {
    transform: translateX(-50%);
  }
}
</style>
