<template>
  <quill-editor
    ref="quill"
    @ready="onQuillReady"
    @change="$emit('change', $event)"
    v-model="content"
    :options="options"/>
</template>

<script>
import { quillEditor } from 'vue-quill-editor'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.bubble.css'
import 'quill-mention'
import { exportToMarkdown } from './src/markdown'

export default {
  props: {
    value: String,
    placeholder: {
      type: String,
      default: 'Write a message',
    },

    channels: {
      type: Array,
      required: false,
    },

    users: {
      type: Array,
      required: false,
    },

    preset: String,
    focus: { type: Boolean, default: true },
    submitOnEnter: { type: Boolean, default: false },
  },

  computed: {
    content: {
      get () {
        return this.internalValue
      },

      set (value) {
        this.$emit('input', exportToMarkdown(this.$refs.quill.quill.getContents()))
      },
    },
  },

  data () {
    // Ref to this to allow enter-handler (submit)
    // to $emit events out of this component
    const vm = this

    return {
      internalValue: this.preset.replace(/\n/g, '<br>'),

      options: {
        debug: false,
        placeholder: this.placeholder,
        theme: 'bubble',
        formats: ['italic', 'bold', 'strike', 'mention'],
        modules: {
          // No need for toolbar.
          toolbar: false,

          // Configure mention module
          // It helps user select user or channel by typing @ or # char
          mention: {
            allowedChars: /^[A-Za-z\sÅÄÖåäöđšćčžĐŠĆČŽ\-_]*$/,
            offsetLeft: 0,
            fixMentionsToQuill: true,
            mentionDenotationChars: ['@', '#'],
            source: function (searchTerm, renderList, mentionChar) {
              let values

              if (mentionChar === '@') {
                values = vm.users
              } else {
                values = vm.channels
              }

              if (searchTerm.length === 0) {
                renderList(values, searchTerm)
              } else {
                const matches = []
                for (let i = 0; i < values.length; i++) {
                  if (~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase())) {
                    matches.push(values[i])
                  }
                }
                renderList(matches, searchTerm)
              }
            },
          },

          keyboard: {
            bindings: {
              // Catch ENTER key event and update component's value data
              handleEnter: {
                key: 'ENTER',
                handler: function () {
                  if (vm.submitOnEnter) {
                    vm.$emit('submit', {
                      value: exportToMarkdown(this.quill.getContents()),
                    })
                    return false
                  }

                  return true
                },
              },
              // Catch ESC key event and emit cancel event
              handleEscape: {
                key: 'ESCAPE',
                handler: function (ev, x) {
                  vm.$emit('cancel', { })
                  return false
                },
              },
            },
          },
        },
      },
    }
  },

  mounted () {
    if (this.$refs.quill !== undefined && this.focus) {
      const q = this.$refs.quill.quill
      // Focus on editor
      q.scrollingContainer.focus()

      // And select all content
      q.setSelection(0, 10000)
    }
  },

  methods: {
    onQuillReady (quill) {
      quill.root.addEventListener('keydown', ev => {
        // on arrow-up but only on empty input!
        if (ev.key === 'ArrowUp' && quill.getText().trim().length === 0) {
          this.$emit('editLastMessage', {})
        }
      })
    },
  },

  components: {
    quillEditor,
  },
}
</script>

<style lang="scss">
  @import '@/assets/sass/_0.commons.scss';
  @media (max-width: $wideminwidth - 1px)
  {
    .ql-editor
    {
      padding: 7px 3px 5px 5px;
      line-height: 18px;
    }
    .ql-editor.ql-blank::before
    {
      left:5px;
      right:5px;
    }
  }
  @media (min-width: $wideminwidth)
  {
    .ql-mention-list-item{
      font-size: 14px;
      height: 30px;
      line-height: 30px;

      &[data-denotation-char="#"]:before {
        content: "#";
      }

      &[data-denotation-char="@"]:before {
        content: "@";
      }
    }
  }
</style>
