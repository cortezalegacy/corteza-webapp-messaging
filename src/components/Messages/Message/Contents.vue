<template>
  <div
    @dblclick="editMessage"
    class="message-content-wrap">
    <p
      v-if="!isEmbedded.src"
      v-for="(r, line) in chunks"
      :key="`${id}${line}`"
      class="line">
      <component
        :is="getChunkTag(c)"
        class="spaced"
        v-for="(c, i) in r"
        :key="`${id}${line}${i}`"
        v-bind="c.props"
        v-html="c.chunk" />
    </p>

    <embedded-box
      v-if="isEmbedded.src"
      :src="isEmbedded.src"
      :chunk="isEmbedded.chunk" />

  </div>
</template>

<script>
import EmbeddedBox from './EmbeddedBox'

export default {
  methods: {
    getChunkTag (chunk) {
      return chunk.meta.tag || 'span'
    },

    editMessage (e) {
      this.$emit('editMessage', { id: this.id })
    },

    isYtLink (msg) {
      if (msg) {
        let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/
        let match = msg.match(regExp)
        if (match && match[2].length === 11) {
          return `https://www.youtube.com/embed/${match[2]}?autoplay=0&enablejsapi=1`
        }
        return false
      }
    },
  },

  computed: {
    isEmbedded () {
      if (this.chunks.length > 1) return false
      let [ c = {} ] = this.chunks[0]
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

    id: {
      required: true,
      default: null,
    },
  },

  components: {
    EmbeddedBox,
  },
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

.message-content-wrap .line {
  margin:0;
  line-height:16px;
}

</style>
