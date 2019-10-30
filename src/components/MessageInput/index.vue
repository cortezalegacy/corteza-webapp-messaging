<template>
  <div class="container">
    <div class="group message-input">
      <!-- Left sction of the input -- file prompt, ... -->
      <div
        v-if="$slots.sectionLeft"
        class="section-left"
      >
        <slot name="sectionLeft" />
      </div>

      <!-- Main section -- editor, drawer, ... -->
      <div class="main">
        <!-- Drawer for non-inline user-extension interaction -->
        <drawer
          v-if="drawerFor"
          class="extension-drawer"
          :plugin="drawerFor"
          v-bind="drawerProps || {}"
          @suggestionSelect="onSuggestSelect"
        />

        <!-- The editor -->
        <editor-content
          v-if="editor"
          ref="editor"
          class="editor"
          :editor="editor"
        />
      </div>

      <!-- Right section of the input -- send, mobile buttons, ... -->
      <div
        v-if="$slots.sectionRight"
        class="section-right"
      >
        <slot name="sectionRight" />
      </div>
    </div>
  </div>
</template>

<script>
import Drawer from './components/Drawer'
import { Editor, EditorContent } from 'tiptap'
import { Placeholder, History } from 'tiptap-extensions'
import { Mention, Keyboard } from './extensions'
import { contentEmpty, getMatches } from './lib'
import { insertText } from 'tiptap-commands'
import { baseKeymap } from 'prosemirror-commands'

export default {
  components: {
    EditorContent,
    Drawer,
  },

  props: {
    value: {
      type: Object,
      required: false,
      default: null,
    },

    placeholder: {
      type: String,
      required: false,
      default: undefined,
    },

    noFocus: {
      type: Boolean,
      required: false,
      default: false,
    },

    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },

    // Allows input to determine when source changed
    source: {
      type: String,
      required: false,
      default: undefined,
    },

    // Needed for the hybrid app
    submitOnEnter: {
      type: Boolean,
      required: false,
      default: false,
    },

    currentUser: {
      type: Object,
      required: false,
      default: () => ({}),
    },

    userSuggestions: {
      type: Array,
      required: false,
      default: () => [],
    },
    channelSuggestions: {
      type: Array,
      required: false,
      default: () => [],
    },
    commandSuggestions: {
      type: Array,
      required: false,
      default: () => [],
    },
    suggestionPriorities: {
      type: Object,
      required: false,
      default: () => ({}),
    },
  },

  data () {
    return {
      // Specify for what plugin, the drawer should be shown
      drawerFor: undefined,
      drawerProps: {},

      // Helper to determine if current content differes from prop's content
      emittedContent: false,

      editor: undefined,
    }
  },

  computed: {
    /**
     * Provides editor's placeholder. Fallbacks to the default set in i18n.
     * @returns {String}
     */
    getPlaceholder () {
      return this.placeholder || this.$t('message.newPlaceholder')
    },
  },

  watch: {
    disabled: {
      // Toggle enabled/disabled
      handler: function (editable) {
        if (this.editor) {
          this.editor.setOptions({
            editable,
          })
        }
      },
      immediate: true,
    },

    getPlaceholder: {
      handler: function (ph) {
        this.editor.extensions.options.placeholder.emptyNodeText = ph
      },
    },

    source: {
      handler: function () {
        if (!this.noFocus) {
          this.focus()
          this.correctSelection()
        }
      },
    },

    value: {
      handler: function (val) {
        // Update happened due to external content change, not model change
        if (!this.emittedContent) {
          this.editor.setContent(val)
          this.correctSelection()
        }

        this.emittedContent = false
      },
      deep: true,
    },
  },

  mounted () {
    this.$nextTick(() => {
      this.initEditor()
      this.$nextTick(() => {
        this.correctSelection()
      })
    })
  },

  beforeDestroy () {
    if (this.editor) {
      this.editor.destroy()
    }
  },

  methods: {
    /**
     * Initializes the editor, sets up extensions, ...
     */
    initEditor () {
      this.editor = new Editor({
        // General options
        autoFocus: !this.noFocus,
        editable: this.editable,
        content: this.value,

        // Extensions
        extensions: [
          new History(),
          new Placeholder({
            emptyNodeClass: 'placeholder',
            emptyNodeText: this.getPlaceholder,
            showOnlyWhenEditable: false,
          }),

          new Keyboard({
            map: {
              'ArrowUp': this.onArrowUp,
              'Enter': this.onEnter,
              'Escape': this.onEscape,
              // Mimic Enter's behaviour
              's-Enter': baseKeymap.Enter,
            },
          }),

          // users
          new Mention({
            items: () => this.userSuggestions,
            onEnter: this.onSuggestionsStart,
            onChange: this.onSuggestionsChange,
            onExit: this.onSuggestCancel,
            onKeyDown: this.onKeyDown,
            onFilter: this.onFilterUserSuggestions,
            mentionClass: 'mention mention-user',

            matcher: {
              char: '@',
              allowSpaces: false,
              startOfLine: false,
            },
          }),

          // channels
          new Mention({
            items: () => this.channelSuggestions,
            onEnter: this.onSuggestionsStart,
            onChange: this.onSuggestionsChange,
            onExit: this.onSuggestCancel,
            onKeyDown: this.onKeyDown,
            onFilter: this.onFilterChannelSuggestions,
            mentionClass: 'mention mention-channel',

            matcher: {
              char: '#',
              allowSpaces: false,
              startOfLine: false,
            },
          }),
        ],

        // Listeners
        onUpdate: ({ getJSON }) => {
          this.emittedContent = true

          const c = getJSON()
          if (contentEmpty(c)) {
            this.$emit('input', null)
            return
          }
          this.$emit('input', c)
        },

        onFocus: () => {
          this.$emit('focus')
        },
        onBlur: () => {
          this.$emit('blur')
        },
      })
    },

    /**
     * Helper for inserting content into tiptap editor.
     * When adding new/more complex content, this should be extended
     * @param {String} content Content to insert
     */
    insert ({ content }) {
      insertText(content)(this.editor.view.state, this.editor.view.dispatch, this.editor.view)
    },

    /**
     * Helper to focus the input -- shouldbe used by wrapper components
     */
    focus () {
      this.editor.focus()
    },

    /**
     * Helper to blur (loose focus) the input -- shouldbe used by wrapper components
     */
    blur () {
      this.editor.blur()
    },

    /**
     * Helper to correct the selection
     */
    correctSelection () {
      if (this.noFocus) {
        return
      }

      this.editor.setSelection(0, this.editor.state.doc.textContent.length + 1)
    },

    onEnter ({ doc }) {
      if (!this.submitOnEnter || !doc.textContent) {
        return
      }

      this.$emit('submit')
      return true
    },

    onArrowUp ({ doc }) {
      if (!doc.textContent) {
        this.$emit('editLastMessage')
        return false
      }
    },

    onEscape () {
      this.$emit('cancel')
    },

    /**
     * Handle when user invokes suggestions. Prepare state.
     * @param {Array} items A set of available suggestions
     * @param {String} query Query string
     * @param {Range} range Tiptap's range object; used for mention insertion
     * @param {Function} command Callback to insert the mention
     */
    onSuggestionsStart ({ items: suggestions, query, range, command }) {
      this.drawerFor = 'Mention'
      // Use $set to invoke reactivity, required by drawer component.
      this.$set(this, 'drawerProps', {
        suggestions,
        query,
        range,
        command,
        // Current suggestion selection
        selection: 0,
      })
    },

    /**
     * Handle when suggestion's state changes (query changed, new items, ...). Update state.
     * @param {Array} items A set of available suggestions
     * @param {String} query Query string
     * @param {Range} range Tiptap's range object; used for mention insertion
     */
    onSuggestionsChange ({ items, query, range }) {
      this.$set(this.drawerProps, 'range', range)
      this.$set(this.drawerProps, 'query', query)
      this.$set(this.drawerProps, 'suggestions', items)

      // Make sure selection has a valid value
      // @todo improve this, so the selection will be preserved
      this.drawerProps.selection = Math.min(this.drawerProps.selection, items.length - 1)
    },

    /**
     * Handle when mentioning gets canceled. Reset state.
     */
    onSuggestCancel () {
      this.drawerProps = {}
      this.drawerFor = undefined
    },

    /**
     * Handle when keyboard event happenes while sugesstions are invoked.
     * Handle suggestion navigation, insertion.
     * @param {Event} event Keyboard event
     */
    onKeyDown ({ event }) {
      // Up arrow
      if (event.keyCode === 38) {
        // Handle overflow
        if (this.drawerProps.selection <= 0) {
          this.drawerProps.selection = this.drawerProps.suggestions.length
        }

        this.drawerProps.selection--
        return true
      }

      // Down arrow
      if (event.keyCode === 40) {
        this.drawerProps.selection = (this.drawerProps.selection + 1) % this.drawerProps.suggestions.length
        return true
      }

      // Enter
      if (event.keyCode === 13) {
        this.onSuggestSelect(this.drawerProps.suggestions[this.drawerProps.selection])
        return true
      }

      return false
    },

    /**
     * Handle to filter user suggestions.
     * @param {Array} items A set of available users. These objects should be pre-processed for fuzzysort
     * @param {String} query Query string
     * @returns {Array} A set of users, that matches the given query
     */
    onFilterUserSuggestions (items, query) {
      items = getMatches({ items, query, priorities: this.suggestionPriorities.User })

      // Aditionally sort matches based on status
      return [ ...items ].sort((a, b) => {
        if (a.user.userID === this.currentUser.userID) {
          return -1
        }
        if (a.online && a.user.userID !== this.currentUser.userID && !b.online) {
          return +1
        }

        return 0
      }).reverse()
    },

    /**
     * Handle to filter channel suggestions.
     * @param {Array} items A set of available channels. These objects should be pre-processed for fuzzysort
     * @param {String} query Query string
     * @returns {Array} A set of channels, that matches the given query
     */
    onFilterChannelSuggestions (items, query) {
      return getMatches({ items, query, priorities: this.suggestionPriorities.Channel }).reverse()
    },

    /**
     * Handle to create a mention from the given suggestion
     * @param {Object} suggestion The suggestion to be inserted
     */
    onSuggestSelect (suggestion) {
      this.drawerProps.command({
        range: this.drawerProps.range,
        attrs: {
          id: suggestion.id,
          label: suggestion.value,
        },
      })
    },
  },
}
</script>

<style lang="scss" scoped>
@import 'corteza-webapp-messaging/src/themes/corteza-base/btns.scss';

$inputWidth: 50px;
$mobileInputWidth: 35px;

/deep/ .ProseMirror {
  min-height: 100px;

  // Disabled editor preserves pointer events - it seams like a bug
  &[contenteditable="false"] {
    pointer-events: none;
  }
}

.container {
  padding: 4px 15px 0;
  height: 100%;

  .group {
    width: 100%;
    position: relative;
    margin-bottom: 2px;
    border: 1px solid $secondary;
  }

  .message-input {
    display: flex;

    .main {
      flex-grow: 1;
      position: relative;

      .extension-drawer {
        position: absolute;
        width: 100%;
        transform: translateY(-100%);
      }

      .editor /deep/ {
        p {
          margin: 0;
          padding: 0;
        }

        // This is required by the placeholder plugin
        .placeholder:first-child::before {
          content: attr(data-empty-text);
          float: left;
          color: rgba($black, 0.45);
          pointer-events: none;
          height: 0;
          font-style: italic;
        }

        .mention-suggestion {
          opacity: 0.7;
        }
        .mention {
          border: 1px solid $primary;
          border-radius: 4px;
          padding: 1px 2px;
          background-color: rgba($primary, 0.05);
        }
      }
    }
  }
}

</style>
