<template>
  <ul>
    <li v-for="(r) in reactions"
        @click="$emit('reaction', { reaction: r.reaction })"
        :key="r.reaction">{{r.reaction}} {{r.count}}</li>


    <li v-for="(reaction) in defaults"
        class="defaults"
        @click="$emit('reaction', { reaction })"
        :key="reaction">{{reaction}}</li>
  </ul>
</template>
<script>
// import { MessageReaction } from '@/types'

const defaults = [
  ':thumbsup:',
  ':thumbsdown:',
  ':heart:',
  ':smile:',
  ':sad:',
  ':rage:',
  ':cry:',
  ':muscle:',
  ':clap:',
]

export default {
  props: {
    reactions: {
      type: Array,
      required: true,
    },
  },

  computed: {
    defaults () {
      if (!this.reactions) {
        return defaults
      }

      const reacted = this.reactions.map(r => r.reaction)
      return defaults.filter(d => reacted.indexOf(d) === -1)
    },
  },
}
</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

ul {
  padding: 0;
  margin: 5px 0 0 0;
  list-style-type: none;
  cursor: pointer;

  li.defaults {
    display: none;
  }

  &:hover > li.defaults {
    display: inline;
  }

  li {
    margin-right: 2px;
    padding: 2px;
    display: inline;
    border: 1px solid $appyellow;
    border-radius: 2px;
    background-color: lighten($appyellow, 30%);
    font-size: 10px;

    &:hover {
      background-color: lighten($appyellow, 20%);
    }
  }
}


</style>
