<template>
  <lightbox>
    <header>
      <span class="closer" @click="onClose()">&times;</span>
    </header>
    <main @click="onClose()">
      <img ref="img" :src="src" :title="caption" @click.stop="noop()">
    </main>
    <footer></footer>
  </lightbox>
</template>

<script>
import Lightbox from './index.vue'
import emitCloseOnEscape from '@/mixins/emitCloseOnEscape'

export default {
  components: {
    Lightbox,
  },

  mixins: [
    emitCloseOnEscape,
  ],

  props: {
    src: {
      type: String,
      required: true,
    },

    caption: {
      type: String,
    },
  },

  methods: {
    onClose () {
      this.$emit('close')
    },

    noop () {},
  },
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

header {
  height: 50px;
  width: 100vw;

  .closer {
    position: fixed;
    color: $appcream;
    float: right;
    font-size: 50px;
    font-weight: bold;
    top: 10px;
    right: 30px;
    cursor: pointer;
    line-height: 30px;
  }
}

main {
  display: flex;
  text-align: center;
  align-items: center;
  height: calc(100vh - 100px);
  width: 100vw;

  img {
    max-width: 90vw;
    max-height: 90vh;
    margin: 0 auto;
    border: 20px solid $appcream;
    background-color: $appcream;
  }
}

footer {
  height: 50px;
  width: 100vw;
}

@media (max-width: $wideminwidth) {
  main {
    img {
      max-width: 95vw;
      max-height: 95vh;
      border-width: 5px;
    }
  }
}

</style>
