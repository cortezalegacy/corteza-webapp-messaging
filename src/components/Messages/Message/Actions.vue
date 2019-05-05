
<template>
  <div class="actions" >
    <div>
      <i class="action icon-smile"
         :title="$t('message.reaction')"
         @click.stop="onReaction"
      ></i>
      <i class="action icon-message-circle-left-speak"
         :title="$t('message.replyInThread')"
         v-if="message.canReply && !hideActionOpenThread"
         @click="$emit('openThreadPanel', { message })"
      ></i>
      <i class="action icon-circle-right"
         :title="$t('message.goto')"
         v-if="!hideActionGoToMessage"
         @click="$emit('goToMessage', { message })"
      ></i>
      <font-awesome-icon
        class="action"
        icon="thumbtack"
        v-if="!hidePinning && !readOnly"
        :class="{pinned:message.isPinned}"
        :title="$t('message.pin')"
        @click="$emit('pinMessage', { message })"
      ></font-awesome-icon>
      <font-awesome-icon
        class="action"
        :icon="['far', 'bookmark']"
        v-if="!hideBookmarking"
        :class="{bookmarked:message.isBookmarked}"
        :title="$t('message.bookmark')"
        @click="$emit('bookmarkMessage', { message })"
      ></font-awesome-icon>
      <i v-if="!isContextMenuOpen && isContextMenuEnabled"
        class="action icon-plus" @click="onContextMenuOpen()"></i>
      <i v-else-if="isContextMenuEnabled"
        class="action icon-close" @click="isContextMenuOpen=false"></i>
    </div>
    <div class="context-menu" v-if="isContextMenuOpen && isContextMenuEnabled">
      <ul class="context-menu-list">
        <li v-if="message.canEdit"
            class="extra-action"
            @click="$emit('editMessage', { message });isContextMenuOpen=false">
            <i class="icon icon-edit"></i>
            <span>{{ $t('message.edit') }}</span>
        </li>
        <li v-if="message.canDelete"
            class="extra-action"
            @click="$emit('deleteMessage', { message });isContextMenuOpen=false">
            <i class="icon icon-trash"></i>
            <span>{{ $t('message.delete') }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    message: {
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
  },

  data () {
    return {
      isContextMenuOpen: false,
    }
  },

  computed: {
    isContextMenuEnabled: function () {
      return !this.readOnly && !this.hideActionsMenu && (this.message.canEdit || this.message.canDelete)
    },
  },

  methods: {
    onContextMenuOpen () {
      const evName = 'Messages/Message.contextMenuOpen'
      this.$bus.$emit(evName)
      this.$bus.$once(evName, () => { this.isContextMenuOpen = false })
      this.isContextMenuOpen = true
    },

    onReaction () {
      this.$bus.$emit('ui.openEmojiPicker', {
        callback: ({ colons }) => {
          // Got called back from the emoji picker, now send the reaction to this message...
          this.$bus.$emit('message.reaction', { message: this.message, reaction: colons })
        },
      })
    },
  },
}

</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/menu-layer.scss';

.actions, .context-menu {
  position: absolute;
  width: auto;
  right: 10px;
  text-align: right;
  top: 0px;
  display: inline-block;
  padding: 0 0.5em;
  z-index: 5;

  .action {
    display: inline-block;
    border: solid 1px rgba($appgrey, 0.25);
    border-radius: 5px;
    line-height: 20px;
    width: 25px;
    background-color: $appwhite;
    font-size: 15px;
    text-align: center;
    box-shadow: 0 0 3px 0 rgba($appgrey, 0.5);
    cursor: pointer;
    color: $defaultlinecolor;
    margin-right: 1px;
    &.unread{
      color: $appred;
    }
    &:hover{
      border-color: $appgrey;
    }
  }
}

.actions {
  min-width: 180px;
  .bookmarked{
    color: $appgreen;
  }
  .pinned {
    color: $appyellow;
  }
  .svg-inline--fa{
    padding: 4px;
    width: 25px;
    height: 22px;
    margin-bottom: -3px;
  }
}

.context-menu {
  z-index: 6;
  margin-top: 1px;
  right: 26px;
  height: 65px;

  &:hover {
    display: block;
  }

  .context-menu-list {
    list-style: none;
    float: right;
    background-color: white;
    box-shadow: 0 0 5px 0 rgba($appgrey, 0.5);
    border: solid 1px rgba($appgrey, 0.25);
    padding: 0;
    margin: 0;
    margin-top: -1px;

    .extra-action {
      padding: 7px 10px;
      text-align: left;

      * {
        display: inline-block;
        line-height: 18px;
        vertical-align: middle;
      }

      .icon {
        font-size: 16px;
        margin-right: 5px;
      }

      &:hover {
        background-color: $appcream;
        cursor: pointer;
      }

    }

  }

}
</style>
