<template>
  <div class="quill-editor">
    <slot name="toolbar"></slot>
    <div ref="editor"></div>
  </div>
</template>

<script>
// Use regular quill, so we can work with Delta objects
import Quill from 'quill'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.bubble.css'
import 'quill-mention'
const fuzzysort = require('fuzzysort')

const suggestionLimit = 10
const filterIn = ['group', 'private']
const ignoreFlags = ['ignored', 'hidden']
const fzsOpts = {
  threshold: -1000,
  limit: suggestionLimit,
  allowTypo: true,

  key: 'key',
}

export default {
  props: {
    value: {
      required: false,
      default: null,
    },

    placeholder: { type: String },

    channels: {
      type: Array,
      required: false,
    },

    users: {
      type: Array,
      required: false,
    },

    channel: {
      type: Object,
      default: () => ({}),
    },
    user: {
      type: Object,
      default: () => ({}),
    },

    focus: { type: Boolean, default: true },
    submitOnEnter: { type: Boolean, default: false },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },

  data () {
    // Ref to this to allow enter-handler (submit)
    // to $emit events out of this component
    const vm = this

    return {
      quill: null,
      crtDelta: this.value,

      options: {
        debug: false,
        theme: 'bubble',
        formats: ['italic', 'bold', 'strike', 'mention'],
        modules: {
          // No need for toolbar.
          toolbar: false,

          // Configure mention module
          // It helps user select user or channel by typing @ or # char
          mention: {
            allowedChars: /^.*$/,
            offsetLeft: 0,
            fixMentionsToQuill: true,
            defaultMenuOrientation: 'top',
            mentionDenotationChars: ['@', '#'],
            renderItem: function (item, searchTerm) {
              if (item.type === 'User') {
                return `
                  <span class="user group ${item.online ? 'full-moon' : 'new-moon'} ${item.member ? 'member' : ''}">
                    <span class="channel-name"><span class="label">${item.value}</span></span>
                  </span>`
              } else {
                return `<span class="channel ${item.opts.type}"><span class="channel-name ">${item.value}</span></span>`
              }
            },
            source: function (searchTerm, renderList, mentionChar) {
              let values

              const { userID: meID } = vm.user
              if (mentionChar === '@') {
                values = vm.users
                let { type, members = [] } = vm.channel

                // In private & group channels, initally show only members
                if (searchTerm.length === 0 && filterIn.find((e) => e === type)) {
                  values = values.filter(a => members.find(m => m === a.id))
                } else {
                  values = values.map(v => ({ ...v, member: members.find(m => m === v.id) }))
                }

                // Fuzzy sort
                if (searchTerm.length !== 0) {
                  values = fuzzysort.go(searchTerm, values, fzsOpts).map(r => r.obj)
                }

                // Extra sort by presence & membership
                values = [ ...values ].sort((a, b) => {
                  if (a.online && !b.online && a.id !== meID) return -1
                  if (members.find(m => m === a.id) && !members.find(m => m === b.id)) return -1

                  return 0
                })
              } else {
                values = vm.channels

                // Show named, not ignored, joined channels
                if (searchTerm.length === 0) {
                  values = values.filter(a => a.name && !ignoreFlags.find(e => e === a.opts.membershipFlag) && a.members.find((e) => e === meID))
                } else {
                  values = fuzzysort.go(searchTerm, values, fzsOpts)
                    .filter(r => !ignoreFlags.find(e => e === r.obj.opts.membershipFlag) || -r.score < r.target.length * 0.65)
                    .map(r => r.obj)
                }
              }

              renderList(values.slice(0, suggestionLimit), searchTerm)
            },
          },

          keyboard: {
            bindings: {
              // Catch ENTER key event and update component's value data
              handleEnter: {
                key: 'ENTER',
                handler: function () {
                  if (vm.submitOnEnter) {
                    vm.$emit('submit', {})
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

  computed: {
    content: {
      get () {
        return this.crtDelta
      },

      set (value) {
        this.crtDelta = value
        this.$emit('input', value)
      },
    },
  },

  watch: {
    disabled: {
      handler: function (newVal, oldVal) {
        this.quill.enable(!newVal)
      },
    },

    value: {
      handler: function (newVal, oldVal) {
        // If value becomes undefined; it should be removed
        if (!newVal || !this.crtDelta || newVal.diff(this.crtDelta).ops.length !== 0) {
          this.crtDelta = newVal
          this.setContent(newVal)
        }
      },
      deep: true,
    },
  },

  created () {
    this.$bus.$on('$t.loaded', this.updatePlaceholder)
    this.$bus.$on('$t.languageChanged', this.updatePlaceholder)

    // if mentions could change, rerender mentions
    // https://github.com/vuejs/vue/issues/844#issuecomment-390498696
    /* eslint-disable no-sequences */
    this.$watch(vm => (vm.users, vm.channels, Date.now()), () => {
      const mm = this.getQuillMention()
      if (!mm || !mm.isOpen) {
        return
      }
      const ii = mm.itemIndex
      mm.onSomethingChange()

      // Restore selection
      mm.itemIndex = (ii) % mm.values.length
      mm.highlightItem()
    })
  },

  beforeDestroy () {
    this.$bus.$off('$t.loaded', this.updatePlaceholder)
    this.$bus.$off('$t.languageChanged', this.updatePlaceholder)
  },

  mounted () {
    this.initialize()

    if (this.quill && this.focus) {
      this.setFocus()
    }
  },

  methods: {
    getQuillMention () {
      return this.quill.getModule('mention')
    },

    setContent (delta) {
      this.quill.setContents(delta)
    },

    setFocus () {
      // Focus on editor
      this.quill.scrollingContainer.focus()

      // And select all content
      let length = 0
      if (this.crtDelta) {
        if (typeof this.crtDelta.length === 'function') {
          length = this.crtDelta.length()
        } else if (!isNaN(this.crtDelta.length)) {
          length = this.crtDelta.length
        }
        this.quill.setSelection(0, length)
      }
    },

    initialize () {
      this.quill = new Quill(this.$refs.editor, this.options)
      this.quill.enable(!this.disabled)

      this.quill.on('selection-change', range => {
        if (!range) {
          this.$emit('blur', { quill: this.quill, range })
        } else {
          this.$emit('focus', { quill: this.quill, range })
        }
      })

      this.quill.on('text-change', () => {
        const content = this.quill.getContents()
        const text = this.quill.getText()

        // quill always adds trailing \n
        if (text === '\n') {
          this.content = null
        } else {
          this.content = content
        }

        this.$emit('change', { text, content })
      })

      this.setContent(this.crtDelta)
      this.onQuillReady(this.quill)
    },

    updatePlaceholder () {
      // Quill doesn't have a setter; so we need to do it like this
      this.quill.root.dataset.placeholder = this.placeholder || this.$t('message.newPlaceholder')
    },

    onQuillReady (quill) {
      quill.root.addEventListener('keyup', ev => {
        // on arrow-up but only on empty input!
        if (ev.key === 'ArrowUp' && quill.getText().trim().length === 0) {
          this.$emit('editLastMessage', {})
        }
      })

      this.updatePlaceholder()
    },
  },
}
</script>

<style lang="scss">
  @import 'corteza-webapp-messaging/src/themes/corteza-base/channel-names.scss';

  .ql-editor {
    -moz-user-select: text;
    -khtml-user-select: text;
    -webkit-user-select: text;
    -ms-user-select: text;
    user-select: text;
  }

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

      &[data-denotation-char="@"] .label {
        color: $secondary;
      }

      &[data-denotation-char="@"] .full-moon .label {
        color: $dark;
      }

      &[data-denotation-char="@"] .member .label {
        font-weight: bold;
      }

      & .channel .channel-name:before {
        color: $dark;
      }
    }
  }
</style>
