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

    focus: {
      type: Boolean,
      required: false,
      default: true,
    },

    // Needed for the hybrid app
    submitOnEnter: {
      type: Boolean,
      required: false,
      default: false,
    },
  },

  data () {
    return {
      // Specify for what plugin, the drawer should be shown
      drawerFor: undefined,
      drawerProps: {},

      editor: undefined,
    }
  },

  computed: {
    /**
     * Manages editor's content
     * @todo ...
     */
    content () {
      return undefined
    },

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
        // @todo ...
      },
      immediate: true,
    },

    getPlaceholder: {
      handler: function (ph) {
        this.editor.extensions.options.placeholder.emptyNodeText = ph
      },
    },
  },

  mounted () {
    this.$nextTick(() => {
      this.initEditor()
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
     * @todo ...
     */
    initEditor () {
      this.editor = new Editor({
        extensions: [
          new History(),
          new Placeholder({
            emptyNodeClass: 'placeholder',
            emptyNodeText: this.getPlaceholder,
            showOnlyWhenEditable: false,
          }),
        ],
        content: ``,
      })
    },
  },
}
</script>

<style lang="scss" scoped>
@import 'corteza-webapp-messaging/src/themes/corteza-base/btns.scss';

$inputWidth: 50px;
$mobileInputWidth: 35px;

.container {
  padding: 4px 15px 0;
  height: 100%;

  .group {
    float: left;
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
      }
    }
  }
}

</style>
