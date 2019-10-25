<template>
  <div class="message-infos">
    <a
      v-if="!hideReplies && message.replies"
      class="info"
      :class="{unread: unread.count}"
      @click="$emit('openThreadPanel', { message })"
    >
      {{ $t('message.replies', { postProcess: 'interval', count: message.replies }) }}
      <span v-if="unread.count > 0 && unread.count < message.replies">({{ $t('message.newReplies', { postProcess: 'interval', count: unread.count }) }})</span>
    </a>
    <span
      v-if="message.updatedAt"
      class="info"
    >{{ $t('message.edited') }}</span>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    message: {
      type: Object,
      required: true,
    },

    hideReplies: Boolean,
  },

  computed: {
    ...mapGetters({
      unreadFinder: 'unread/find',
    }),

    unread () {
      return this.unreadFinder(this.message)
    },
  },
}
</script>
<style lang="scss" scoped>
.message-infos
{
  font-size:10px;
  display: inline;
  .info
  {
    display:inline-block;
    font-weight: 300;
    &.unread{
      color: $danger;
      font-weight: 900;
    }
    &:after
    {
      content: '●';
      display:inline-block;
      margin:0 2px;
    }
    &:last-child:after
    {
      content:'';
    }
  }

  a {
    cursor: pointer;
  }
}
</style>
