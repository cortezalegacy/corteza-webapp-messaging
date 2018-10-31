<template>
  <div
    @dblclick="editMessage"
    @click="handleLinks"
    class="message-content-wrap">

    <span
      v-if="!isEmbedded.src"
      class="line" v-html="getContent(content.message)" />

    <embedded-box
      v-if="isEmbedded.src"
      :src="isEmbedded.src"
      :chunk="isEmbedded.chunk" />

  </div>
</template>

<script>
import EmbeddedBox from './EmbeddedBox'
import hljs from 'highlight.js'
import 'highlight.js/styles/xcode.css'

const MD = require('markdown-it')({
  html: true,
  breaks: true,
  linkify: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value
      } catch (__) {}
    }

    return '' // use external default escaping
  },
})

export default {
  methods: {
    getContent (message) {
      return MD.render(message)
    },

    // Ref: https://dennisreimann.de/articles/delegating-html-links-to-vue-router.html
    handleLinks ($event) {
      const { target } = $event
      // handle only links that occur inside the component and do not reference external resources
      if (target && target.matches(".message-content-wrap a:not([href*='://'])") && target.href) {
        const { altKey, ctrlKey, metaKey, shiftKey, button, defaultPrevented } = $event

        // don't handle with control keys
        if (metaKey || altKey || ctrlKey || shiftKey) return

        // don't handle when preventDefault called
        if (defaultPrevented) return

        // don't handle right clicks
        if (button !== undefined && button !== 0) return

        // don't handle if `target="_blank"`
        if (target && target.getAttribute) {
          const linkTarget = target.getAttribute('target')
          if (/\b_blank\b/i.test(linkTarget)) return
        }

        if ($event.preventDefault) {
          $event.preventDefault()

          let to = {
            name: target.dataset.route,
            params: JSON.parse(target.dataset.params),
          }
          this.$router.push(to)
        }
      }
    },

    getChunkTag (chunk) {
      return chunk.meta.tag || 'span'
    },

    editMessage (e) {
      this.$emit('editMessage', { id: this.id })
    },

    isYtLink (msg) {
      if (msg) {
        let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/
        let match = msg.match(regExp)
        if (match && match[2].length === 11) {
          return `https://www.youtube.com/embed/${match[2]}?autoplay=0&enablejsapi=1`
        }
        return false
      }
    },
  },

  computed: {
    isEmbedded () {
      let { message } = this.content
      if (!message.length) return 0

      return { src: this.isYtLink(message), chunk: message }
    },
  },

  props: {
    content: {
      type: Object,
      required: true,
      default: () => { return {} },
    },

    id: {
      required: true,
      default: null,
    },
  },

  components: {
    EmbeddedBox,
  },
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

.message-content-wrap .line {
  margin:0;
  line-height:16px;
}
</style>

<style lang="scss">
@import '@/assets/sass/_0.commons.scss';

p {
  margin: 0;
}

blockquote {
  margin: 5px 20px 5px 5px;
  padding-left: 5px;
  border-left: 4px solid $appcream;
}

.line pre {
  padding: 7px 5px;
  background-color: white;
  border: 1px solid $appgrey;
  border-radius: 5px;
}
</style>

