<template>
  <div>
    <ul class="suggestion-list">
      <component
        :is="sc(s)"
        v-for="(s, i) of suggestions"
        :key="s.id"
        :ref="`si-${i}`"
        :suggestion="s"
        :selection="selection"
        :index="i"
        v-on="$listeners"
      />
    </ul>

    <footer class="nav-info">
      <p>Use arrow keys to navigate, ...</p>
    </footer>
  </div>
</template>

<script>
import * as components from './loader'

export default {
  props: {
    suggestions: {
      type: Array,
      required: true,
      default: () => [],
    },

    selection: {
      type: Number,
      required: false,
      default: 0,
    },
  },

  methods: {
    /**
     * Determine component to be used with the given suggestion type
     * @param {String} type Suggestion's type
     * @returns {Component|undefined}
     */
    sc ({ type }) {
      return components[type]
    },
  },
}
</script>

<style lang="scss" scoped>
.suggestion-list {
  padding: 0;
  margin: 0;
}

.nav-info {
  position: sticky;
  bottom: 0;
  padding: 3px 10px;
  background-color: $primary;
  color: $white;

  p {
    margin: 0;
  }
}

</style>
