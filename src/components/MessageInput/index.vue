<template>
  <div class="message-input">
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
</template>

<script>
import Drawer from './components/Drawer'
import { Editor, EditorContent } from 'tiptap'
import { Placeholder, History, HardBreak } from 'tiptap-extensions'
import { Mention, Keyboard, HtmlPaster } from './extensions'
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
      handler: function (disabled) {
        if (this.editor) {
          this.editor.setOptions({
            editable: !disabled,
          })
        }
      },
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

    userSuggestions: {
      handler: function (val, ov) {
        // \shrug; Vue wanting to be smart and saying I might have a loop without this
        if (!val || val === ov) {
          return
        }

        // Determine new suggestions for current query
        if (this.drawerProps.suggestions) {
          this.drawerProps.suggestions = this.getUserSuggestions(val, this.drawerProps.query)
        }
      },
      deep: true,
    },

    channelSuggestions: {
      handler: function (val) {
        if (this.drawerProps.suggestions) {
          const suggestions = this.onFilterChannelSuggestions(val, this.drawerProps.query)
          this.drawerProps.suggestions = suggestions
        }
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
        editable: !this.disabled,
        content: this.value,

        // Extensions
        extensions: [
          new HardBreak(),
          new HtmlPaster(),
          new History(),
          new Placeholder({
            emptyNodeClass: 'placeholder',
            emptyNodeText: this.getPlaceholder,
            showOnlyWhenEditable: false,
          }),

          new Keyboard({
            map: {
              ArrowUp: this.onArrowUp,
              Enter: this.onEnter,
              Escape: this.onEscape,
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

        /**
         * Handle on update events. Process current document & update data model
         * @param {Function} getJSON Converts current document to JSON
         */
        onUpdate: ({ getJSON }) => {
          this.emittedContent = true

          const c = getJSON()
          if (contentEmpty(c)) {
            this.$emit('input', null)
            return
          }
          this.$emit('input', c)
        },

        /**
         * Handle on focus. Emit
         */
        onFocus: () => {
          this.$emit('focus')
        },

        /**
         * Handle on blur. Emit
         */
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
     * Helper for setting content into tiptap editor -- overwrites current content.
     * When adding new/more complex content, this should be extended
     * @param {String} content Content to insert
     */
    set ({ content }) {
      this.editor.setContent(content)
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

    /**
     * On enter, emit submit. Parent should handle if content should actually be submitted
     * @param {Document} doc Document object
     * @returns {Boolean} If editor should continue with further actions
     */
    onEnter () {
      this.$emit('submit', this.submitOnEnter)

      return this.submitOnEnter
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
      // Use $set to invoke reactivity, required by drawer component.
      this.$set(this, 'drawerProps', {
        suggestions,
        prevQuery: undefined,
        query,
        range,
        command,
        // Current suggestion selection
        selection: 0,
      })
      // Should be in bottom, since test utils don't make batches
      this.drawerFor = 'Mention'

      this.$emit('suggestStart')
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
      this.$emit('suggestEnd')
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
     * Helper to request new suggestions
     * @param {String} type Suggestion type
     * @param {String} query Query to use
     */
    requestSuggestions (type, query) {
      if (query && query !== this.drawerProps.prevQuery) {
        this.$emit('requestSuggestions', { type, query })
      }
    },

    /**
     * Handle to filter user suggestions.
     * @param {Array} items A set of available users. These objects should be pre-processed for fuzzysort
     * @param {String} query Query string
     * @returns {Array} A set of users, that matches the given query
     */
    onFilterUserSuggestions (items, query) {
      this.$set(this.drawerProps, 'prevQuery', this.drawerProps.query)
      this.requestSuggestions('user', query)
      return this.getUserSuggestions(items, query)
    },

    /**
     * Determines user suggestions
     * @param {Array<Object>} items Available user mentions
     * @param {String} query Query to use
     * @returns {Array<Object>}
     */
    getUserSuggestions (items, query) {
      items = getMatches({ items, query, priorities: this.suggestionPriorities.User })

      // Aditionally sort matches based on status
      return [...items].sort((a, b) => {
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
      this.$set(this.drawerProps, 'prevQuery', this.drawerProps.query)
      this.requestSuggestions('channel', query)

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
      this.$emit('suggestEnd')
    },
  },
}
</script>

<style lang="scss" scoped>
.message-input {
  width: 100%;
  position: relative;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 13px;

  .extension-drawer {
    position: absolute;
    width: 100%;
    transform: translateY(-100%);
  }

  // @fixme This is a bandage solution; do more research for a nicer grammarly integration.
  /deep/ grammarly-extension {
    margin-top: 3px;
  }

  /deep/ .ProseMirror {
    user-select: text;
    max-height: 30vh;
    padding: 12px 15px;
    padding-right: 0;
    line-height: 1.42;
    height: 100%;
    outline: none;
    overflow-y: auto;
    tab-size: 4;

    // Disabled editor preserves pointer events - it seams like a bug
    &[contenteditable="false"] {
      pointer-events: none;
    }

    p {
      margin: 0;
      padding: 0;
    }

    // This is required by the placeholder plugin
    .placeholder:first-child::before {
      color: rgba($black, 0.6);
      content: attr(data-empty-text);
      font-style: italic;
      left: 15px;
      pointer-events: none;
      position: absolute;
      right: 15px;
    }

    .mention-suggestion {
      opacity: 0.7;
    }
    .mention {
      border-radius: 4px;
      padding: 3px 2px;
      border: 1px solid rgba($primary, 0.3);
      background-color: rgba($primary, 0.15);
    }
  }

  @media (max-width: $wideminwidth - 1px) {
    /deep/ .ProseMirror {
      padding: 7px 3px 5px 5px;
      line-height: 18px;

      .placeholder:first-child::before {
        left: 5px;
        right: 5px;
      }
    }
  }
}

</style>
