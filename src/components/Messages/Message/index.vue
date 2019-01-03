<template>
    <li
      @click.alt.exact.prevent="onMarkAsUnread"
      @click.meta.exact.prevent="onOpenThread"
      class="message-n-meta"
      :class="{
        'consecutive': consecutive,
        'first': !consecutive,
        'attachement' : message.attachment,
        'valid' : message.attachment && message.attachment.size > 0,
        'with-replies' : message.replies,
        'edited' : message.updatedAt,
        'pinned' : highlightPinned && message.isPinned,
        'bookmarked' : highlightBookmarked && message.isBookmarked,
        'first-unread': isLastRead && !isFirst && !isLast,
        'unread': isUnread,
        'type-channel-event': message.type === 'channelEvent',
      }"
      ref="message"
      :key="message.ID">

        <section v-if="message.type !== 'channelEvent'">
          <em v-if="!consecutive" class="avatar">
            <avatar :user="message.user" />
          </em>
          <em  v-if="!consecutive" class="author selectable">{{ label(message.user) }}</em>
          <span class="date">
              {{ moment(message.createdAt).fromNow() }}
              <span v-if="!isToday(message.createdAt)">at {{ momentHourMinute(message.createdAt) }}</span>
            </span>
          <em class="time selectable">{{ momentHourMinute(message.createdAt) }}</em>
          <em class="day selectable">{{ momentDayMonth(message.createdAt) }}</em>

          <actions
            class="actions"
            v-if="!hideActions && !inEditing"
            v-bind="$props"
            @editMessage="inEditing=true"
            @deleteMessage="onDeleteMessage"
            v-on="$listeners" />
        </section>
        <section v-else>
          <em class="day selectable">{{ momentDayMonth(message.createdAt) }}</em>
        </section>
        <div
          class="selectable"
          :class="{ from_me: (message.user || {}).ID === currentUser.ID,
          'message' : !inEditing,
           }">
          <attachment
            v-if="message.attachment"
            class="message-content"
            :attachment="message.attachment"
            :inline="message.type === 'inlineImage'" />

          <message-input
            v-if="inEditing && !readOnly"
            :hideFileUpload="true"
            :message="message"
            @submit="onInputSubmit"
            @cancel="inEditing=false"
            @deleteMessage="onDeleteMessage"
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
        v-on="$listeners" />
    </li>
</template>
<script>
import * as moment from 'moment'
import Attachment from './Attachment'
import Contents from './Contents'
import Reactions from './Reactions'
import EmbeddedBox from './EmbeddedBox'
import Footnote from './Footnote'
import Actions from './Actions'
import Avatar from '@/components/Avatar'
import MessageInput from '@/components/MessageInput'

export default {
  props: {
    message: {
      type: Object,
      required: true,
    },
    consecutive: {
      type: Boolean,
      required: false,
    },
    currentUser: {
      type: Object,
      required: true,
    },

    readOnly: Boolean,

    hideActions: Boolean,
    hideActionOpenThread: Boolean,
    hideActionsMenu: Boolean,
    hidePinning: Boolean,
    hideBookmarking: Boolean,
    hideActionGoToMessage: { type: Boolean, default: false },
    hideReactions: Boolean,

    isUnread: Boolean,
    isLastRead: Boolean,
    isFirst: Boolean,
    isLast: Boolean,

    showEditor: Boolean,

    // Controling bookmarked and pinned messages highlighting
    highlightBookmarked: { type: Boolean, default: true },
    highlightPinned: { type: Boolean, default: true },
  },

  data () {
    return {
      loadSuspended: false,
      previousMessageCount: -1,
      allowAutoScroll: true,
      scrollToRef: false,
      resetUnreadTimeout: null,
      showEditorInternal: false,
    }
  },

  computed: {
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

    // Wrapper that append message info to event
    onReaction ({ reaction }) {
      this.$bus.$emit('message.reaction', { message: this.message, reaction })
    },

    onDeleteMessage () {
      if (confirm('Delete this message?')) {
        // @todo a more slick, inline confirmation...
        this.$bus.$emit('message.delete', { message: this.message })
      }
    },

    onMarkAsUnread () {
      this.$bus.$emit('message.markAsUnread', { message: this.message })
    },

    onOpenThread () {
      if (this.message.canReply && !this.hideActionOpenThread) {
        this.$emit('openThreadPanel', { message: this.message })
      }
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
    Actions,
  },
}

</script>

<style lang="scss">
@import '@/assets/sass/_0.commons.scss';

mark {
  background-color: rgba($appyellow, 0.25);
  display: inline-block;
  border-radius: 1em;
  padding: 1px 5px;
  margin: 0 3px;

  b {
    font-weight: normal;
    margin-right: 2px;
    display: inline-block;
  }

}

.channel-mark {
  background-color: rgba($appblue, 0.15);
}

.command-mark {
  background-color: rgba($appgrey, 0.15);
}

//if my own messages ligthen text to increase difference.
.from_me {
  mark {
    background-color: rgba($appyellow, 1);
    color: black;
  }

  .channel-mark {
    background-color: rgba($appblue, 0.75);
    color: white;
  }

}

.spaced:first-child mark {
  margin-left: 0;
}

a{
  color: $defaulttextcolor;
  font-weight: 900;
}

</style>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

em{
  font-style: normal;
}
.message-n-meta {
  margin-bottom: 10px;
  padding: 1px 5px 1px 66px;
  position: relative;

  &:hover,
  &:focus{
    background-color: rgba($appgrey, 0.1);
    .date {
      display: inline-block;
    }
    .actions {
      display: block;
    }
    .reactions.no-reactions {
      display: block;
      right: 0px;
    }
  }

  &.type-channel-event{
    padding: 1px 1px 1px 66px;
    margin-bottom: 0px;
    font-style: italic;
    &:hover{
      background: none;
    }
    .message{
      background: none;
      &:before{
        background: none;
      }
      .message-content {
        font-size: 12px;
      }
    }
    &.first-unread {
      font-style: normal;
    }
    .day {
      top: 8px;
    }
  }

  &.bookmarked {
    .message{
      border-right: 4px solid $appgreen;
    }
  }

  &.pinned {
    .message{
      border-right: 4px solid $appyellow;
    }
    &.bookmarked{
      .message{
        &:after{
          content:" ";
          background: linear-gradient(to bottom, rgba(47,188,149,1) 0%, rgba(47,188,148,1) 50%, rgba(255,204,50,1) 50%, rgba(255,204,50,1) 100%);
          display: block;
          height: 100%;
          width: 5px;
          position: absolute;
          bottom: 0;
          right: -5px;
          border-top-right-radius: 5px;
          border-bottom-right-radius: 5px;
        }
      }
    }
  }

  &.unread {
    .message{
      /*border-right: 4px solid $appred;*/
    }
  }

  &.consecutive {
    margin-top: -10px;
    &:hover,
    &:focus{
      .date {
        display: none;
      }

      .time {
        display: block;
        background-color: lighten($appgrey, 30);
        z-index: 5;
      }
    }
    &.type-channel-event{
      margin-top: 0;
    }

    &.attachement {
      margin-bottom: 10px;
      // because attachements are bigger than 65px;
    }
    .time {
      left: 22px;
      top: 10px;
    }
    .day {
      display: none;
    }
    .message {
      &:before {
        display: none;
      }
    }

  }

  .message{
    margin-right: 10px;
  }

  .reactions {
    &.no-reactions{
      position: absolute;
      display: none;
      margin-top: -5px;
      margin-left: -10px;
      z-index: 2;
      float: right;
    }
  }
}

.author,
.date,
.time,
.day {
  color: $appgrey;
}

.avatar {
  position: absolute;
  left: 20px;
}

.author,
.date {
  display: inline-block;
  padding: 2px 0.5em;
}

.time, .day {
  position: absolute;
  left: 20px;
  top: 35px;
}

.time {
  display: none;
  font-size: 10px;
}

.date, .actions {
  display: none;
}

.message {
  position: relative;
  background-color: $messagebgcolor;
  word-wrap: break-word;
  border-radius: 3px;
  padding: 6px;
  display: table;
  min-width: 180px;

  &:before {
    content: " ";
    background-color: $messagebgcolor;
    position: absolute;
    left: -5px;
    top: 8px;
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
  }

  &.from_me {
    background-color: $currentmymessagebgcolor;

    span,
    &:before  {
      background-color: $currentmymessagebgcolor;
    }
  }

  .message-content {
    font-size: 14px;
    word-break: break-word;
  }

}

.first-unread {
  border-bottom: 1px solid $appred;
  &::after{
    content: "New messages";
    background: white;
    color: $appred;
    font-weight: 900;
    display: inline;
    position: absolute;
    float: right;
    right: 17px;
    line-height: 20px;
    margin-top: -10px;
    padding: 0 10px;
    border-radius: 5px;
    z-index: 1;
  }
}
</style>
