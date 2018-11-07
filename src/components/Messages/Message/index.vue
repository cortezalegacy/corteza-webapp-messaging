<template>
    <li
      class="message-n-meta"
      :class="{
        'continued': continued,
        'first': !continued,
        'attachement' : message.attachment,
        'valid' : message.attachment && message.attachment.size > 0,
        'with-replies' : message.replies,
        'edited' : message.updatedAt,
        'pinned' : message.isPinned,
        'bookmarked' : message.isBookmarked,
        'first-unread': isFirstUnread && !isFirst && !isLast,
        'unread': isUnread,
      }"
      ref="message"
      :key="message.ID">

        <section>
          <em class="dot-dot-dot"></em>
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

          <!-- Actions -->
          <div class="actions" v-if="!hideActions">
            <!-- i class="action icon-message-circle-left-speak"></i -->
            <i class="action icon-message-circle-left-speak"
               title="Reply in thread"
               v-if="message.canReply && !hideActionOpenThread"
               @click="$emit('openThread', { message })"
            ></i>
            <i class="action icon-circle-right"
               title="Go to mesage"
               v-if="!hideActionGoToMessage"
               @click="$emit('goToMessage', { message })"
            ></i>
            <i class="action icon-clipboard"
               v-if="!hidePinning"
               :class="{pinned:message.isPinned}"
               title="Pin message for everyone to see"
               @click="$bus.$emit('message.pin', { message })"
            ></i>
            <i class="action icon-smile"
               v-if="!hideBookmarking"
               :class="{bookmarked:message.isBookmarked}"
               title="Bookmark message for personal reference"
               @click="$bus.$emit('message.bookmark', { message })"
            ></i>
            <i v-if="!isContextMenuOpen && isContextMenuEnabled"
              class="action icon-plus" @click="onContextMenuOpen()"></i>
            <i v-else-if="isContextMenuEnabled"
              class="action icon-close" @click="isContextMenuOpen=false"></i>
          </div>
          <div class="context-menu" v-if="isContextMenuOpen && isContextMenuEnabled">
            <ul class="context-menu-list">
              <li v-if="message.canReply && !hideActionOpenThread"
                  class="extra-action"
                  @click="$emit('openThread', { message })">
                  <i class="icon icon-message-circle-left-speak"></i>
                  <span>Reply in thread</span>
              </li>
              <li v-if="message.canEdit"
                  class="extra-action"
                  @click="inEditing=true">
                  <i class="icon icon-edit"></i>
                  <span>edit message</span>
              </li>
              <li v-if="message.canDelete"
                  class="extra-action"
                  @click="$emit('deleteMessage', { message })">
                  <i class="icon icon-trash"></i>
                  <span>delete message</span>
              </li>
            </ul>
          </div>
          <!-- /Actions -->
        </section>
        <div
          class="message"
          :class="{ from_me: (message.user || {}).ID === currentUser.ID }">
          <attachment
            v-if="message.attachment"
            class="message-content"
            :attachment="message.attachment"
            :inline="message.type === 'inlineImage'" />

          <message-input
            v-if="inEditing"
            :message="message"
            @submit="onInputSubmit"
            @cancel="inEditing=false"
            ref="channelInput" />

          <contents
            v-if="!inEditing"
            class="message-content"
            :id="message.ID"
            :content="message.message" />

          <embedded-box
            v-if="embeded"
            :src="embeded.src" />

        </div>

      <reactions
        v-if="!hideReactions && message.type !== 'channelEvent'"
        class="reactions"
        @reaction="onReaction"
        :class="{'no-reactions': message.reactions.length === 0}"
        :reactions="message.reactions" />

      <footnote
        :message="message"
        @openThread="$emit('openThread', $event)" />
    </li>
</template>
<script>
import * as moment from 'moment'
import Attachment from './Attachment'
import Contents from './Contents'
import Reactions from './Reactions'
import EmbeddedBox from './EmbeddedBox'
import Footnote from './Footnote'
import Avatar from '@/components/Avatar'
import MessageInput from '@/components/MessageInput'

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

    hideActions: Boolean,
    hideReactions: Boolean,
    hidePinning: Boolean,
    hideBookmarking: Boolean,
    hideActionGoToMessage: { type: Boolean, default: true },
    hideActionOpenThread: Boolean,
    hideActionsMenu: Boolean,

    isUnread: Boolean,
    isFirstUnread: Boolean,
    isFirst: Boolean,
    isLast: Boolean,

    showEditor: Boolean,
  },

  data () {
    return {
      loadSuspended: false,
      previousMessageCount: -1,
      allowAutoScroll: true,
      scrollToRef: false,
      resetUnreadTimeout: null,
      isContextMenuOpen: false,
      showEditorInternal: false,
    }
  },

  computed: {
    isContextMenuEnabled: function () {
      return !this.hideActionsMenu &&
        ((this.message.canReply && !this.hideActionOpenThread) ||
          this.message.canEdit ||
          this.message.canDelete)
    },

    embeded () {
      if (this.message) {
        let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/
        let match = this.message.message.match(regExp)
        if (match && match[2].length === 11) {
          return { src: `https://www.youtube.com/embed/${match[2]}?autoplay=0&enablejsapi=1` }
        }
        return false
      }
    },

    inEditing: {
      get () {
        return this.showEditor || this.showEditorInternal
      },
      set (value) {
        this.showEditorInternal = value
        if (!value) {
          this.$emit('cancelEditing')
        }
      },
    },
  },

  methods: {
    onInputSubmit ({ value }) {
      this.showEditor = false
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

    onContextMenuOpen () {
      const evName = 'Messages/Message.contextMenuOpen'
      this.$bus.$emit(evName)
      this.$bus.$once(evName, () => { this.isContextMenuOpen = false })
      this.isContextMenuOpen = true
    },

    // Wrapper that append message info to event
    onReaction ({ reaction }) {
      this.$bus.$emit('message.reaction', { message: this.message, reaction })
    },
  },

  components: {
    Attachment,
    Contents,
    Avatar,
    Reactions,
    MessageInput,
    EmbeddedBox,
    Footnote,
  },
}

</script>

<!-- this does not work in scoped... -->
<!-- no clue why, in any case should not break anything -->
<style lang="scss">
  @import '@/assets/sass/_0.commons.scss';
  // @todo put those in generic file or resets ?

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

.dot-dot-dot
{
  position:absolute;
  left:35px;
  top:55px;
  float:left;
  background:url(../../../assets/images/vertical-dots.svg) no-repeat;
  background-size: auto 10px;
  min-height:12px;
  min-width:4px;
  z-index:4;
}
.message-n-meta
{
  margin-bottom:10px;
  position:relative;
  padding:5px 5px 5px 66px;
  position:relative;
  &.continued
  {
    background:none;
    .dot-dot-dot
    {
      display:none;
    }
    &.attachement
    {
      margin-bottom:10px; // because attachements are bigger than 65px;
    }
    .message:before
    {
      display: none !important;
    }
  }

  .reactions.no-reactions {
    position: absolute;
    display: none;
    margin-top: -5px;
    margin-left: -10px;
    padding: 5px 10px 0px 10px;
    width: 100%;
    z-index: 2;
  }
}

// all margins in one place
.message-n-meta.continued
{
  margin-top:-18px;
}
.message-n-meta.first
{
}
.message-n-meta.first + .message-n-meta.continued
{
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
}
.author, .date
{
  display:inline-block;
  padding:2px 0.5em;
}
.author
{
  padding:2px 0.5em 2px 2px;
}
.time, .day
{
  position:absolute;
  left:20px;
  top:40px;
}
.time
{
  display:none;
  font-size:10px;
}
.continued
{
  .time
  {
    left:22px;
    top:15px;
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

.actions {
  .bookmarked, .pinned {
    color: $appyellow;
  }
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
    top:-15px;
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
  .actions
  {
    min-width:180px;
  }
  .context-menu
  {
    min-width:180px;
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

  .reactions.no-reactions {
    display: block;
    right: 0px;
  }
}

.message-n-meta.continued:hover,
.message-n-meta.continued:focus
{
 .actions, .context-menu
  {
    top:-15px;
  }
  .date
  {
    display:none;
  }
  .time
  {
    display:block;
    background-color:lighten($appgrey,30);
    z-index:5;
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
  min-width:180px;
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
      font-size:12px;
    }
  }
}

.unread {
  /*background: red;*/
}

.first-unread {
  border-bottom: 2px solid $appred;
}

@media (min-width: $wideminwidth)
{
  /*
  .actions, .context-menu
  {
    transform: translateX(-50%);
  }
  .in-thread
  {
    .actions, .context-menu
    {
      transform: translateX(0%);
    }
  }
  */
}
</style>
