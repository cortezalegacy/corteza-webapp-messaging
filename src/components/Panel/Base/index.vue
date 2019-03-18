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
    }
  },

  computed: {
    styles () {
      let s = {
        '--width': this.width + 'px',
      }

      if (this.dx) {
        let l = this.dx < 0 ? this.dx : -this.width + this.dx
        if (l < 0) {
          l = Math.max(l, -this.width)
        } else {
          l = Math.min(0, -this.width + this.dx)
        }

        s.left = l + 'px'
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
    panStart (e) {
      // Conditions to ignore gesture
      const { changedTouches = new TouchList() } = e
      if (changedTouches.length > 1) {
        this.ignorePan = true
      }

      const [ t ] = changedTouches
      if (this.hidden && t.pageX > 25) {
        this.ignorePan = true
      }
    },

    panMove (e) {
      if (this.ignorePan) return

      const { deltaX } = e

      if (this.dx + deltaX > 0) {
        this.panDir = 'panright'
      } else {
        this.panDir = 'panleft'
      }

      if (!this.ignorePan && ((this.hidden && this.panDir === 'panright') || (!this.hidden && this.panDir === 'panleft'))) {
        this.dx += deltaX
      }

      if (this.hidden && this.panDir === 'panright' && this.dx > this.width / 2) {
        console.debug('pan:right.show')
        this.$emit('update:hidden', false)
        this.ignorePan = true
        this.dx = 0
      }
      if (!this.hidden && this.panDir === 'panleft' && this.dx < -this.width / 2) {
        console.debug('pan:left.hide')
        this.$emit('update:hidden', true)
        this.ignorePan = true
        this.dx = 0
      }
    },

    panEnd (e) {
      if (this.hidden && this.dx > 0 && this.panDir === 'panright' && this.dx < this.width / 2) {
        console.debug('pan:right.show.abort')
        this.$emit('update:hidden', true)
        this.ignorePan = false
        this.dx = -this.width
      } else if (!this.hidden && this.dx < 0 && this.panDir === 'panleft' && this.dx > -this.width / 2) {
        console.debug('pan:left.hide.abort')
        this.$emit('update:hidden', false)
        this.ignorePan = false
        this.dx = 0
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
