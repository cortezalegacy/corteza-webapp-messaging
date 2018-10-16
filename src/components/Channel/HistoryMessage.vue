<template>
  <span class="crust_iam_main__message__content-wrap">
    <component
      v-if="!isEmbedded.src"
      :is="getChunkTag(c)"
      class="spaced"
      v-for="c in chunks"
      :key="c.chunk"
      v-bind="c.props"
      v-html="c.chunk" />

    <embedded-box
      v-if="isEmbedded.src"
      :src="isEmbedded.src"
      :chunk="isEmbedded.chunk" />

  </span>
</template>

<script>
import EmbeddedBox from './EmbeddedBox'

export default {
  methods: {
    getChunkTag (chunk) {
      return chunk.meta.tag || 'span'
    },

    isYtLink (msg) {
      if (msg) {
        let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/
        let match = msg.match(regExp)
        if (match && match[2].length === 11) {
          return `https://www.youtube.com/embed/${match[2]}?autoplay=1&enablejsapi=1`
        }
        return false
      }
    },
  },

  computed: {
    isEmbedded () {
      if (this.chunks.length > 1) return false
      let [ c = {} ] = this.chunks
      c = c.chunk

      return { src: this.isYtLink(c), chunk: c }
    },
  },

  props: {
    chunks: {
      type: Array,
      required: true,
      default: () => [],
    },
  },

  components: {
    EmbeddedBox,
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
