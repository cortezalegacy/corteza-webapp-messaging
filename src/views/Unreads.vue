<template>
  <div>
    <header class="header sub-header">
      <label
        class="channel-toggle"
        @click="$emit('toggleChannelPanel', null)">
        <i class="icon-menu4"></i></label>

      <span>Unread messages</span>
    </header>
    <main v-if="unreadChannels && unreadChannels.length > 0">
      <section v-for="(unread) in unreadChannels" :key="unread.ID" v-if="findChannelByID(unread.ID)">
        <header class="channel-unread">
          {{ labelChannel(unread.ID) }} ({{unread.count}})
          <button @click="markAsRead(unread)" class="btn btn-green">Mark as read</button>
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
    <empty v-else class="empty">No unread messages</empty>
    <footer v-if="unreadChannels && unreadChannels.length > 0">
      <button @click="markAllAsRead()">mark all as read [@todo]</button>
    </footer>
  </div>
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
    this.$store.dispatch('channels/setCurrent', null)
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
  @import '@/assets/sass/headers.scss';
  @import '@/assets/sass/btns.scss';
.channel-container {
  width: 100%;
}

.discussion {
  list-style: none;
  padding: 0;
  margin: 0;
}

div > main {
  overflow-y: scroll;
  overflow-x: scroll;
  height: calc(100vh - 60px);
}

.header span {
  font-size: 13px;
  font-family: $crustheavy;
  font-weight: bold;
}

.empty {
  text-align: center;
  margin-top: 30px;
}

.channel-unread {
  font-size: 18px;
  padding: 10px 20px;
}

hr {
  background-color: $appwhite;
  height: 1px;
  border: none;
}

.channel-toggle
{
  font-size:24px;
  float:left;
  line-height:50px;
  width:60px;
  margin:0;
  margin-left:-20px;
  text-align:center;
  border:none;
  padding-top:5px;
}
</style>
