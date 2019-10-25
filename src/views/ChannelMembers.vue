<template>
  <section class="members">
    <a
      class="closer"
      @click="$router.back()"
    >&times;</a>
    <h1>{{ $t('channel.members.label') }}</h1>
    <table>
      <tr
        v-for="u in users"
        :key="u.userID"
      >
        <td class="right">
          <button
            v-if="isMember(u.userID)"
            @click="remove(u.userID)"
          >
            {{ $t('channel.members.remove') }}
          </button>
          <button
            v-if="!isMember(u.userID)"
            @click="add(u.userID)"
          >
            {{ $t('channel.members.add') }}
          </button>
        </td>
        <td>{{ getLabel(u) }}</td>
      </tr>
    </table>
  </section>
</template>
<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ChannelMembers',
  props: {
    channelID: {
      type: String,
      default: undefined,
    },
  },

  data () {
    return {
      members: [],
    }
  },

  computed: {
    ...mapGetters({
      users: 'users/list',
    }),

    isMember () {
      return (userID) => !!this.members.find(m => m.userID === userID)
    },
  },

  mounted () {
    this.$MessagingAPI.channelMembers({ channelID: this.channelID }).then(members => {
      this.members = members
    }).catch(error => {
      console.error('Failed to load channel members', { error })
    })
  },

  methods: {
    add (userID) {
      this.$MessagingAPI.channelJoin({ channelID: this.channelID, userID }).then((members) => {
        this.members = this.members.concat(members)
      })
    },

    remove (userID) {
      this.$MessagingAPI.channelPart({ channelID: this.channelID, userID }).then(() => {
        const i = this.members.findIndex(m => m.userID === userID)
        if (i > 0) {
          this.members.splice(i, 1)
        }
      })
    },
  },
}
</script>
<style lang="scss" scoped>
label {
  display:block
}

.right {
  text-align: right
}

</style>
