<template>
  <span class="crust_iam_main__message__content-wrap">
    <component
      :is="getChunkTag(c)"
      class="spaced"
      v-for="c in chunks"
      :key="c.chunk"
      v-bind="c.props"
      v-html="c.chunk" />

  </span>
</template>

<script>
export default {
  methods: {
    getChunkTag (chunk) {
      return chunk.meta.tag || 'span'
    },
  },

  props: {
    chunks: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
}
</script>

<style scoped>
.spaced {
  margin-left: 5px;
}

.crust_iam_main__message__content-wrap .spaced:first-child {
  margin-left: 0;
}

</style>
