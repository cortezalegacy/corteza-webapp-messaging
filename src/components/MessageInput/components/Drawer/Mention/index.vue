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
      <i18next
        path="messageInput.drawer.mention.navigation"
        tag="p"
      >
        <font-awesome-icon icon="arrow-up" />
        <font-awesome-icon icon="arrow-down" />
        <font-awesome-icon
          icon="level-up-alt"
          transform="down-2 rotate-90"
          class="spaced"
        />
      </i18next>
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
  padding: 5px 10px;
  background-color: $primary;
  color: $white;

  p {
    margin: 0;

    .spaced {
      margin-left: 10px;
    }
  }
}

</style>
