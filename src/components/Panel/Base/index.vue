<template>
  <aside :style="styles" :class="classes" ref="panel">
    <div><slot></slot></div>
  </aside>
</template>
<script>
import anime from 'animejs'

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

    disableGestures: {
      type: Boolean,
      default: false,
    },
  },

  data () {
    return {
      // Parameters used for gestures
      dx: 0,
      panDir: null,
      ignorePan: false,
      openThreshold: 25,
      speedThreshold: 0.4,
      panStarted: null,
      transitioning: false,
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

      // If mid-gesture, determine panel's position based on orientation
      if (this.dx) {
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
        transitioning: this.transitioning,
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
    animate (properties = {}, ...targets) {
      const opt = { targets, easing: 'easeOutCubic', ...properties }
      anime(opt)
    },

    // Helpers for gestures
    panelShow (hidden, properties, ...targets) {
      this.ignorePan = true
      this.animate({ ...properties,
        complete: () => {
          this.$emit('update:hidden', hidden)
          this.dx = 0
        } }, ...targets)
    },
    panelAbort (hidden) {
      this.$emit('update:hidden', hidden)
      this.ignorePan = false
      this.dx = 0
      this.transitioning = true
    },

    // Sets start paramaters for pan gesture & determines if it should be handeled
    panStart ({ e, clientWidth }) {
      if (this.disableGestures) return

      this.panStarted = e.timeStamp
      this.transitioning = false

      // Conditions to ignore gesture
      const { changedTouches = new TouchList() } = e
      const [ t ] = changedTouches
      if (t && this.hidden) {
        // Check if gesture is allowed based on start touch & panel orientation
        this.ignorePan = (this.orientation === 'left' && t.pageX > this.openThreshold) ||
          (this.orientation === 'right' && clientWidth - t.pageX > this.openThreshold)
      }
    },

    // Handeles panel's position while pan gesture is active
    panMove ({ e }) {
      if (this.ignorePan || this.disableGestures) return
      const { deltaX } = e

      // Determine overall pan direction
      if (this.dx + deltaX > 0) {
        this.panDir = 'panright'
      } else {
        this.panDir = 'panleft'
      }

      if ((this.hidden && this.panDir === this.openedBy[this.orientation]) || (!this.hidden && this.panDir === this.closedBy[this.orientation])) {
        // Accumulate dx, used for panel's position
        this.dx += deltaX
      }
    },

    // Determine what to do when users stopps panning
    panEnd ({ e }) {
      if (this.disableGestures) return

      if (!this.ignorePan) {
        // Calculate distance & speed used for final can open/close check & animation duration
        const speed = Math.abs(this.dx / (e.timeStamp - this.panStarted))
        const distLeft = this.width - Math.abs(this.dx)
        const duration = distLeft / speed
        let properties = { duration }

        // Checks if it should open
        if (Math.abs(this.dx) > this.width / 2 || speed > this.speedThreshold) {
          if (this.hidden && this.panDir === this.openedBy[this.orientation]) {
            properties[this.orientation] = `+=${distLeft}px`
            this.panelShow(false, properties, this.$refs.panel)
          } else if (!this.hidden && this.panDir === this.closedBy[this.orientation]) {
            properties[this.orientation] = `-=${distLeft}px`
            this.panelShow(true, properties, this.$refs.panel)
          }
        } else if (Math.abs(this.dx) > 0) {
          // Checks if it should close
          if (this.hidden && this.openedBy[this.orientation]) {
            this.panelAbort(true)
          } else if (!this.hidden && this.closedBy[this.orientation]) {
            this.panelAbort(false)
          }
        }
      }

      this.ignorePan = false
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

  &.transitioning {
    transition: all .3s;
  }

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
