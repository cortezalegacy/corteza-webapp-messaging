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

  watch: {
    selection: {
      handler: function (nv) {
        const p = this.$parent.$el
        const c = ((this.$refs[`si-${nv}`] || [])[0] || {}).$el
        if (!c) {
          return
        }
        const off = this.checkPositioning(p, c)
        if (off !== undefined) {
          p.scrollTop = off
        }
      },
    },
  },

  methods: {
    /**
     * Helper to determine if scroll position should be adjusted or not
     * @param {Node} p Parent container
     * @param {Node} c Node in question
     * @returns {Number|undefined} if undefined, no adjustment is needed
     */
    checkPositioning (p, c, downBuffer = 2) {
      if (c.offsetTop < p.scrollTop) {
        // adjust up
        return c.offsetTop
      } else if ((c.offsetTop + c.clientHeight * downBuffer) > p.scrollTop + p.clientHeight) {
        // adjust down
        return (c.offsetTop + c.clientHeight * downBuffer) - p.clientHeight
      }
    },

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
