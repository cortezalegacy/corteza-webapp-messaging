<template>
  <div class="message-infos">
    <a class="info" v-if="message.replies" @click="$emit('openThreadPanel', { message })">{{message.replies}} {{ message.replies > 1 ? 'replies':'reply' }}</a>
    <span class="info" v-if="message.updatedAt">edited</span>
  </div>
</template>
<script>
export default {
  props: {
    message: {
      type: Object,
      required: true,
    },
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
