<template>
  <div v-if="unreadChannels && unreadChannels.length > 0">
    <header>
      <b>[WIP] Unreads in {{ unreadChannels.length }} channel(s)</b>
    </header>
    <main>
      <section v-for="(unread) in unreadChannels" :key="unread.ID">
        <header>
          <channel-name :channel="findChannelByID(unread.ID)" /> {{unread.count}}
          <button @click="markAsRead(unread)">mark as read [@todo]</button>
        </header>
        <section>
          <messages
            ref="messages"
            :messages="unreadInChannel(unread.ID, unread.lastMessageID)"
            :currentUser="currentUser"
            origin="unreads"
            :scrollable="false"
            v-on="$listeners" />
        </section>
        <hr/>
      </section>
    </main>
    <footer>
      <button @click="markAllAsRead()">mark all as read [@todo]</button>
    </footer>
  </div>
  <empty v-else>No unread messages</empty>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import Messages from '@/components/Messages'
import Empty from '@/components/Empty'

export default {
  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
      unreadChannels: 'unread/channels',
      findChannelByID: 'channels/findByID',
      unreadInChannel: 'history/unreadInChannel',
    }),
  },

  watch: {
    'unreadChannels' (newUnreadChannels) {
      this.loadUnreadMessages()
    },
  },

  mounted () {
    this.loadUnreadMessages()
  },

  methods: {
    ...mapActions({
      setChannelUnread: 'unread/setChannel',
    }),

    loadUnreadMessages () {
      this.unreadChannels.forEach(u => {
        if (u.lastMessageID) {
          this.$ws.getMessages({ channelID: u.ID, firstID: u.lastMessageID })
        } else {
          this.$ws.getMessages({ channelID: u.ID })
        }
      })
    },

    markAsRead ({ ID, lastMessageID }) {
      const messages = this.unreadInChannel(ID, lastMessageID)
      if (messages.length === 0) {
        return
      }

      const newLastMessageID = messages[messages.length - 1].ID

      this.$ws.recordChannelView(ID, newLastMessageID)
      this.setChannelUnread({ ID, newLastMessageID })
    },

    markAllAsRead () {
      this.unreadChannels.forEach(this.markAsRead)
    },
  },

  components: {
    Messages,
    Empty,
  },
}
</script>

<style lang="scss" scoped>
.discussion
{
  list-style:none;
  padding:0;
  margin:0;
}

div > main {
  overflow-y: scroll;
  overflow-x: scroll;
  height: 100vh;
}
</style>
