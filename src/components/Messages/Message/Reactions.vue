<template>
  <ul :class="{'has-reactions':reactions.length > 0}">
    <li
      v-for="r in reactions"
      :key="r.reaction"
      :title="labels(r.users)"
      @click="$emit('reaction', { reaction: r.reaction })"
    >
      <span v-html="emoji(r.reaction)" /><sup>{{ r.count }}</sup>
    </li>
  </ul>
</template>
<script>
import { textToEmoji } from 'corteza-webapp-messaging/src/lib/emoji'

export default {
  mixins: [
    // emojis,
  ],

  props: {
    reactions: {
      type: Array,
      default: () => [],
    },
  },

  computed: {
    getReactions () {
      return this.reactions.filter(r => r.reaction)
    },
  },

  methods: {
    emoji (str) {
      return textToEmoji(str)
    },

    labels (users) {
      return users.map(({ label }) => label).join(', ')
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
