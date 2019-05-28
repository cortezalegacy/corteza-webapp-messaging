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
    }
  },

  computed: {
    // Cached properties for animations
    openPanDir () {
      return { left: 'panright', right: 'panleft' }[this.orientation]
    },
    closePanDir () {
      return { left: 'panleft', right: 'panright' }[this.orientation]
    },
    opening () {
      return this.panDir === this.openPanDir
    },
    closing () {
      return this.panDir === this.closePanDir
    },
    animEndPrefix () {
      return this.opening ? '+' : '-'
    },
    orientationMult () {
      return this.orientationLeft ? 1 : -1
    },
    orientationLeft () {
      return this.orientation === 'left'
    },
    orientationRight () {
      return this.orientation === 'right'
    },
    // ---

    styles () {
      let s = {
        '--width': this.width + 'px',
      }

      // If mid-gesture, determine panel's position based on orientation
      if (this.dx) {
        let base = this.dx * this.orientationMult
        let l = base < 0 ? Math.max(this.dx, -this.width) : Math.min(0, -this.width + this.dx)
        s['transform'] = `translateX(${l + 'px'})`
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
      const opt = { targets, easing: 'easeOutQuart', ...properties }
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
        this.ignorePan = (this.orientationLeft && t.pageX > this.openThreshold) ||
          (this.orientationRight && clientWidth - t.pageX > this.openThreshold)
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

      if ((this.hidden && this.opening) || (!this.hidden && this.closing)) {
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
          if ((this.hidden && this.opening) || (!this.hidden && this.closing)) {
            properties.translateX = `${this.animEndPrefix}=${(this.orientationMult) * distLeft}px`
            this.panelShow(!this.hidden, properties, this.$refs.panel)
          }
        } else if (Math.abs(this.dx) > 0) {
          // Checks if it should close
          if ((this.hidden && this.openPanDir) || (!this.hidden && this.closePanDir)) {
            this.panelAbort(this.hidden)
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

  // Force hardware acceleration
  will-change: transform;
  // Falback for older browsers
  -webkit-transform: translate3d(0, 0, 0);
  -moz-transform: translate3d(0, 0, 0);
  -ms-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);

  &.transitioning {
    transition: transform .3s;
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
    left: 0;
    &.unpinned {
      transform: translateX(0);
      &.hidden {
        transform: translateX(calc(-1 * var(--width)));
      }
    }
  }

  &.right {
    right: 0;
    &.unpinned {
      transform: translateX(0);
      &.hidden {
        transform: translateX(var(--width));
      }
    }
  }
}

</style>
