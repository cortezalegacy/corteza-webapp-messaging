<script>
import GroupMembers from '@/components/Channel/GroupMembers'

export default {
  components: {
    GroupMembers,
  },

  props: {
    channel: {
      type: Object,
      required: true,
    },
  },

  render (createElement) {
    if (this.channel.type === 'group') {
      return createElement(GroupMembers, {
        props: {
          group: this.channel,
        },
      })
    } else {
      return createElement('span', this.labelChannel(this.channel))
    }
  },
}
</script>
