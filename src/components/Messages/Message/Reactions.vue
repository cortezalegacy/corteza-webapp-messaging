<template>
  <ul :class="{'has-reactions':reactions.length > 0}">
    <li v-for="(r) in reactions"
        v-if="r.reaction"
        @click="$emit('reaction', { reaction: r.reaction })"
        :key="r.reaction">{{parse(r.reaction)}}<sup>{{r.count}}</sup></li>

    <li v-for="(reaction) in defaultReactions"
        class="defaults"
        @click="$emit('reaction', { reaction })"
        :key="reaction">{{parse(reaction)}}</li>
  </ul>
</template>
<script>
import EmojiConvertor from 'emoji-js'

const emoji = new EmojiConvertor()

const defaultReactions = [
  ':thumbsup:',
  ':thumbsdown:',
  ':heart:',
  ':smile:',
  ':disappointed:',
  ':rage:',
  ':cry:',
  ':muscle:',
  ':clap:',
]

export default {
  props: {
    reactions: {
      type: Array,
      value: [],
    },
  },

  computed: {
    defaultReactions () {
      if (!this.reactions) {
        return defaultReactions
      }

      const reacted = this.reactions.map(r => r.reaction)
      return defaultReactions.filter(d => reacted.indexOf(d) === -1)
    },
  },

  methods: {
    parse (str) {
      return emoji.replace_colons(str)
    },
  },

  mixins: [
    // emojis,
  ],
}
</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

ul {
  padding: 0;
  margin: 5px 0 0 0;
  list-style-type: none;

  li {
    cursor: pointer;
    margin-right: 2px;
    padding: 1px 3px;
    display: inline;
    border: 1px solid $appyellow;
    border-radius: 2px;
    background-color: lighten($appyellow, 30%);
    font-size: 14px;
    letter-spacing: -2px;

    sup {
      font-size: 60%;
    }

    &:hover {
      background-color: lighten($appyellow, 20%);
    }
  }

  .defaults {
    float: right;
  }

  &:hover > li.defaults {
    display: inline;
  }
}

ul.has-reactions .defaults {
  display: none;
}


</style>
