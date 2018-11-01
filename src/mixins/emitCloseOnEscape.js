// Adds keyup event listener on component creation and removes it on component destruction
// It emits 'close' event when escape key is pressed
export default {
  created () {
    window.addEventListener('keyup', this.onKeyup)
  },

  destroyed () {
    window.removeEventListener('keyup', this.onKeyup)
  },

  methods: {
    onKeyup (ev) {
      if (event.key === 'Escape') {
        this.$emit('close')
      }
    },
  },
}
