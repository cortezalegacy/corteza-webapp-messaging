// Make sure changes are reflected in declare.scss:
const $wideminwidth = 720
const $confortableminwidth = 1020

export default {
  data () {
    return {
      isCordovaPlatform: !!process.env.CORDOVA_PLATFORM,
    }
  },

  methods: {
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
      return this.uiIsWide()
    },

    // Should we hide submit button and catch ENTER keypress for submit?
    // This does not work 100% when resizing, but it is GoodEnoughTM for now.
    uiEnableSubmitButton () {
      return !this.uiIsWide()
    },
  },
}
