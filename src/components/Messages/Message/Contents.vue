<script>
import markdown2VDOM from '@/lib/markdown'
import { vdomifyEmojis } from '@/lib/emoji'

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

  methods: {
    editMessage (e) {
      this.$emit('editMessage', { id: this.id })
    },
  },

  render (createElement) {
    const trimmed = this.content.trim()

    if (trimmed.length > 0) {
      return createElement('div', null, vdomifyEmojis(markdown2VDOM(trimmed).toVue(createElement), createElement))
    }
  },
}
</script>
<style lang="scss" scoped>
p {
  margin: 0;
}

p + p {
  // double \n are split into separate paragraphs
  margin-top: 1em;
}

blockquote {
  margin: 5px 20px 5px 5px;
  padding-left: 5px;
  border-left: 4px solid $light;
}

pre {
  padding: 7px 5px;
  background-color: white;
  border: 1px solid $secondary;
  border-radius: 5px;
  max-width: 100%;
  overflow: scroll;
  font-size: 12px;
  white-space: pre-wrap;
}

p > code {
  padding: 1px 3px;
  font-size: 90%;
  background-color: white;
  border: 1px solid $secondary;
  border-radius: 2px;
  color: $danger
}

  a {
    color: $dark;
  }
</style>
