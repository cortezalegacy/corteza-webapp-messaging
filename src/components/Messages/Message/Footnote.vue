<template>
  <div class="message-infos">
    <a class="info"
       :class="{unread: unread.count}"
       v-if="!hideReplies && message.replies"
       @click="$emit('openThreadPanel', { message })">
      {{ $t('message.replies', { postProcess: 'interval', count: message.replies }) }}
      <span v-if="unread.count">({{ $t('message.newReplies', { postProcess: 'interval', count: unread.count }) }})</span>
    </a>
    <span class="info" v-if="message.updatedAt">{{ $t('message.edited') }}</span>
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
