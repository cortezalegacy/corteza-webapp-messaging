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

  data () {
    return {
      dx: 0,
      panDir: null,
      ignorePan: false,
      openThreshold: 25,

      openedBy: {
        left: 'panright',
        right: 'panleft',
      },
      closedBy: {
        left: 'panleft',
        right: 'panright',
      },
    }
  },

  computed: {
    styles () {
      let s = {
        '--width': this.width + 'px',
      }

      if (this.dx) {
        // Based on panel orientation, determine it's positions
        let base = this.orientation === 'left' ? this.dx : -this.dx
        let l = base < 0 ? Math.max(this.dx, -this.width) : Math.min(0, -this.width + this.dx)
        if (this.orientation === 'right') {
          l *= -1
        }

        s[this.orientation] = l + 'px'
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

  created () {
    this.$bus.$on('gesture:touchstart', this.panStart)
    this.$bus.$on('gesture:touchmove', this.panMove)
    this.$bus.$on('gesture:touchend', this.panEnd)
  },

  beforeDestroy () {
    this.$bus.$off('gesture:touchstart', this.panStart)
    this.$bus.$off('gesture:touchmove', this.panMove)
    this.$bus.$off('gesture:touchend', this.panEnd)
  },

  methods: {
    // Helpers for gestures
    panelShow () {
      console.debug('pan:right.show')
      this.$emit('update:hidden', false)
      this.ignorePan = true
      this.dx = 0
    },
    panelHide () {
      console.debug('pan:left.hide')
      this.$emit('update:hidden', true)
      this.ignorePan = true
      this.dx = 0
    },
    abortShow () {
      console.debug('pan:right.show.abort')
      this.$emit('update:hidden', true)
      this.ignorePan = false
      this.dx = 0
    },
    abortHide () {
      console.debug('pan:left.hide.abort')
      this.$emit('update:hidden', false)
      this.ignorePan = false
      this.dx = 0
    },

    panStart ({ e, clientWidth }) {
      // Conditions to ignore gesture
      const { changedTouches = new TouchList() } = e
      if (changedTouches.length > 1) {
        this.ignorePan = true
        return
      }

      const [ t ] = changedTouches
      if (this.hidden) {
        // Check if gesture started in an allowed area based on orientation
        this.ignorePan = (this.orientation === 'left' && t.pageX > this.openThreshold) ||
          (this.orientation === 'right' && clientWidth - t.pageX > this.openThreshold)
      }
    },

    panMove ({ e, clientWidth }) {
      if (this.ignorePan) return
      const { deltaX } = e

      // Determine overall pan direction
      if (this.dx + deltaX > 0) {
        this.panDir = 'panright'
      } else {
        this.panDir = 'panleft'
      }

      if ((this.hidden && this.panDir === this.openedBy[this.orientation]) || (!this.hidden && this.panDir === this.closedBy[this.orientation])) {
        this.dx += deltaX
      }

      if (Math.abs(this.dx) > this.width / 2) {
        if (this.hidden && this.panDir === this.openedBy[this.orientation]) {
          this.panelShow()
        } else if (!this.hidden && this.panDir === this.closedBy[this.orientation]) {
          this.panelHide()
        }
      }
    },

    panEnd ({ e }) {
      if (Math.abs(this.dx) > 0 && Math.abs(this.dx) < this.width / 2) {
        if (this.hidden && this.openedBy[this.orientation]) {
          this.abortShow()
        } else if (!this.hidden && this.closedBy[this.orientation]) {
          this.abortHide()
        }
      }

      this.ignorePan = false
      this.dx = 0
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
