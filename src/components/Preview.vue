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
import Lightbox from '../components/Lightbox'

export default {
  props: {
    src: {
      type: String,
      required: true,
    },

    caption: {
      type: String,
    },
  },

  created () {
    window.addEventListener('keyup', this.onKeyup)
  },


  destroyed () {
    window.removeEventListener('keyup', this.onKeyup)
  },

  methods: {
    onClose () {
      this.$emit('close')
    },

    onKeyup (ev) {
      if (event.key === 'Escape') {
        this.$emit('close')
      }
    },

    noop () {},
  },

  components: {
    Lightbox,
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
  }
}

main {
  display: flex;
  text-align: center;
  align-items: center;
  height: calc(100vh - 100px);
  width: 100vw;

  img {
    max-width: 90vw !important;
    max-height: 90vh !important;
    margin: 0 auto;
    border: 20px solid $appcream;
    background-color: $appcream;
  }
}

footer {
  height: 50px;
  width: 100vw;
}




</style>
