import Vue from 'vue'
import i18next from 'i18next'
import lngDetector from 'i18next-browser-languagedetector'
import VueI18Next from '@panter/vue-i18next'
import intervalPlural from 'i18next-intervalplural-postprocessor'

import en from './en'

// Initializes i18n options, registers
// plugin on a given Vue instance and returns the options (to be used in new Vue({ i18n: ... })
export default (lng = 'en', fallbackLng = lng) => {
  const options = {
    lng,
    fallbackLng,
    defaultNS: 'messaging',
    ns: ['messaging'],
    debug: process.env.NODE_ENV !== 'production',
    detection: {
      // to overwrite, to use user defined, to guess user's lang
      order: ['querystring', 'localStorage', 'cookie', 'navigator'],
      caches: [/* 'localStorage', 'cookie' */],
    },
    resources: {
      en,
    },
  }

  i18next
    .use(lngDetector)
    .use(intervalPlural)
    .init(options)

  i18next.on('loaded', () => Vue.prototype.$bus.$emit('$t.loaded'))
  i18next.on('languageChanged', () => Vue.prototype.$bus.$emit('$t.languageChanged'))

  Vue.use(VueI18Next)

  return new VueI18Next(i18next)
}
