import variables from 'corteza-webapp-messaging/src/themes/corteza-base/variables.scss'
const confortableMinWidth = parseInt(variables.confortableMinWidth, 10)
const wideMinWidth = parseInt(variables.wideMinWidth, 10)

const types = {
  update: 'update',
}

export default function () {
  const isCordovaPlatform = !!process.env.CORDOVA_PLATFORM

  return {
    namespaced: true,
    state: {
      isCordovaPlatform,
      isComfortableWidth: false,
      prevUiIsComfortableWidth: undefined,

      isWide: false,
      prevUiIsWide: undefined,

      focusMessageInput: false,
      enableSubmitButton: false,
      enableEmojiButton: !isCordovaPlatform,
      enableMobileMediaSourceButtons: isCordovaPlatform,
    },

    getters: {
      isCordovaPlatform: state => state.isCordovaPlatform,
      isComfortableWidth: state => state.isComfortableWidth,
      isWide: state => state.isWide,
      focusMessageInput: state => state.focusMessageInput,
      enableSubmitButton: state => state.enableSubmitButton,
      enableEmojiButton: state => state.enableEmojiButton,
      enableMobileMediaSourceButtons: state => state.enableMobileMediaSourceButtons,
    },

    actions: {},

    mutations: {
      [types.update] (state, { innerWidth }) {
        const isComfortableWidth = innerWidth > confortableMinWidth
        const isWide = innerWidth > wideMinWidth

        if (isComfortableWidth !== state.prevIsComfortable) {
          state.isComfortableWidth = isComfortableWidth
          state.prevUiIsComfortableWidth = isComfortableWidth
        }

        if (isWide !== state.prevIsWide) {
          state.isWide = isWide
          state.prevUiIsWide = isWide
          state.focusMessageInput = isWide
          state.enableSubmitButton = !isWide
        }
      },
    },
  }
}
