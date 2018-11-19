<template>
  <aside :style="styles" :class="classes">
    <div><slot></slot></div>
  </aside>
</template>
<script>
export default {
  props: {
    pinned: {
      type: Boolean,
      default: false,
    },

    hidden: {
      type: Boolean,
      default: false,
    },

    orientation: {
      type: String,
      default: 'left',
    },

    width: {
      type: Number,
      default: 360,
    },
  },

  computed: {
    styles () {
      let s = {
        '--width': this.width + 'px',
      }

      return s
    },

    classes () {
      let c = {
        unpinned: !this.pinned,
        hidden: this.hidden,
      }

      c[this.orientation] = true // assign orientation class left/right...

      return c
    },
  },
}
</script>
<style scoped lang="scss">
//inlude generic definitions
@import '@/assets/sass/_0.commons.scss';

aside {
  z-index: 1001;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: var(--width);
  max-width: 100%;
  background-color: $menupanebgcolor;

  div {
    height: 100vh;
    overflow-x: hidden;
    overflow-y: scroll;
  }

  &.unpinned {
    position: absolute;
    top: 0;
  }

  &.left {
    &.unpinned {
      left: 0;
      &.hidden {
        left: calc(-1 * var(--width));
      }
    }
  }

  &.right {
    &.unpinned {
      right: 0;
      &.hidden {
        right: calc(-1 * var(--width));
      }
    }
  }
}

</style>
