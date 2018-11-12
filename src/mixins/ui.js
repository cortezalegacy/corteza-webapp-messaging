// Adds keyup event listener on component creation and removes it on component destruction
// It emits 'close' event when escape key is pressed

// Make sure changes are reflected in declare.scss:
const $wideminwidth = 720
const $confortableminwidth = 1020

export default {
  computed: {
    uiIsComfortableWidth () {
      return window.innerWidth > $confortableminwidth
    },

    uiIsWide () {
      return window.innerWidth > $wideminwidth
    },

    // Should message input be focused?
    //
    // When viewing on mobile we need to prevent this, because
    // it opens a (system) keyboard that covers half of the screen
    uiFocusMessageInput () {
      return this.uiIsWide
    },
  },
}
