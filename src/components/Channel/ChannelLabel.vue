<script>

export default {
  props: {
    channel: {
      type: Object,
      required: true,
    },

    users: {
      type: Object,
      default: () => ({}),
    },
  },

  render (createElement) {
    return createElement('span', this.labelChannel(this.channel, this.users))
  },
}
</script>
