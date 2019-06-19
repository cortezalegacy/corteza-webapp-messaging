<template>
  <ul :class="{'has-reactions':reactions.length > 0}">
    <li v-for="(r) in reactions"
        v-if="r.reaction"
        :title="labels(r.userIDs)"
        @click="$emit('reaction', { reaction: r.reaction })"
        :key="r.reaction"><span v-html="emoji(r.reaction)"></span><sup>{{r.count}}</sup></li>
  </ul>
</template>
<script>
import { textToEmoji } from '@/lib/emoji'

export default {
  mixins: [
    // emojis,
  ],

  props: {
    reactions: {
      type: Array,
      value: [],
    },
  },

  methods: {
    emoji (str) {
      return textToEmoji(str)
    },

    labels (IDs) {
      return IDs.map(this.labelUser).join(', ')
    },
  },
}
</script>
<style scoped lang="scss">

ul {
  padding: 0;
  margin: 5px 0 0 0;
  list-style-type: none;

  .reactions.no-reactions{
    border: 1px solid $warning;
    border-radius: 2px;
    background-color: lighten($warning, 30%);

  }
  li {
    cursor: pointer;
    margin-right: 2px;
    padding: 1px 3px;
    display: inline;
    font-size: 14px;
    letter-spacing: -2px;

    sup {
      font-size: 60%;
    }

    &:hover {
      background-color: lighten($warning, 20%);
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
