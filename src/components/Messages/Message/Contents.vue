<script>
import markdown2VDOM from '@/lib/markdown'
import emoji from '@/lib/emoji'

export default {
  props: {
    content: {
      type: String,
      required: true,
    },

    id: {
      required: true,
      default: null,
    },
  },

  render (createElement) {
    const trimmed = this.content.trim()

    if (trimmed.length > 0) {
      return createElement('div', null, markdown2VDOM(emoji(trimmed)).toVue(createElement))
    }
  },

  methods: {
    editMessage (e) {
      this.$emit('editMessage', { id: this.id })
    },
  },
}
</script>
<style lang="scss" scoped>
@import '@/assets/sass/_0.commons.scss';

p {
  margin: 0;
}

img.emoji {
  height: 1em;
  width: 1em;
  margin: 0 .05em 0 .1em;
  vertical-align: -0.1em;
}

blockquote {
  margin: 5px 20px 5px 5px;
  padding-left: 5px;
  border-left: 4px solid $appcream;
}

pre {
  padding: 7px 5px;
  background-color: white;
  border: 1px solid $appgrey;
  border-radius: 5px;
}

p > code {
  padding: 1px 3px;
  font-size: 90%;
  background-color: white;
  border: 1px solid $appgrey;
  border-radius: 2px;
  color: $appred
}
</style>
