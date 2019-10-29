<script>
export default {
  props: {
    suggestion: {
      type: Object,
      required: true,
      default: () => ({}),
    },

    selection: {
      type: Number,
      required: true,
      default: 0,
    },

    index: {
      type: Number,
      required: true,
      default: 0,
    },
  },

  methods: {
    /**
     * Handle on suggestion click; emit selection
     */
    onClick () {
      this.$emit('suggestionSelect', this.suggestion)
    },
  },
}
</script>
