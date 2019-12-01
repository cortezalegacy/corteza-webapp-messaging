<script>
import GroupMembers from 'corteza-webapp-messaging/src/components/Channel/GroupMembers'

export default {
  components: {
    GroupMembers,
  },

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
    if (this.channel.type === 'group') {
      return createElement(GroupMembers, {
        props: {
          group: this.channel,
          users: this.users,
        },
      })
    } else {
      return createElement('span', this.labelChannel(this.channel, this.users))
    }
  },
}
</script>
