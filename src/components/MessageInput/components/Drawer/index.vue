<template>
  <div class="drawer">
    <!-- This is where main content should go -->
    <component
      :is="getComponent"
      v-if="getComponent"
      v-bind="$attrs"
      v-on="$listeners"
    />

    <div
      v-else
      class="invalid"
    >
      <h5>Invalid</h5>
    </div>
  </div>
</template>

<script>
import * as components from './loader'

export default {
  inheritAttrs: false,

  props: {
    plugin: {
      type: String,
      required: true,
      default: undefined,
    },
  },

  computed: {
    /**
     * Determines what content component should be rendered
     * based on plugin type.
     * @returns {Component|undefined}
     */
    getComponent () {
      return components[this.plugin]
    },
  },

}
</script>

<style lang="scss" scoped>
.drawer {
  background-color: $white;
  padding: 0;
  margin-bottom: 1px;
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
  box-shadow: 0 0 3px rgba($black, 0.1);
  border: 1px solid rgba($black, 0.15);
  max-height: 300px;
  overflow-x: hidden;
}

</style>
