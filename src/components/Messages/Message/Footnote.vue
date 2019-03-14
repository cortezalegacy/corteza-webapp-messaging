<template>
  <div class="message-infos">
    <a class="info"
       :class="{unread: countUnread(message)}"
       v-if="message.replies"
       @click="$emit('openThreadPanel', { message })">{{ $t('message.replies', { postProcess: 'interval', count: message.replies }) }}</a>
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
  },

  computed: {
    ...mapGetters({
      countUnread: 'unread/count',
    }),
  },
}
</script>
<style lang="scss" scoped>
@import '@/assets/sass/_0.commons.scss';

.message-infos
{
  font-size:10px;
  color: $appgrey;
  display: inline;
  .info
  {
    display:inline-block;
    font-weight: 300;
    &.unread{
      color: $appred;
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
