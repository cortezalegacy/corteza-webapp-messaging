<template>
  <div>
    <header class="header sub-header">
      <label
        class="channel-toggle"
        @click="$emit('toggleChannelPanel', null)">
        <i class="icon-menu4"></i></label>

      <span class="title">{{ $t('message.unread') }}</span>
      <button @click="markAllAsRead()" class="btn">{{ $t('message.markAllAsUnread') }} [@todo]</button>
    </header>
    <main v-if="unreadChannels && unreadChannels.length > 0">
      <section v-for="(unread) in unreadChannels" :key="unread.channelID" v-if="findChannelByID(unread.channelID)">
        <header class="channel-unread">
          {{ labelChannel(unread.channelID) }} ({{unread.count}})
          <button @click="markAsRead(unread)" class="btn">{{ $t('message.markAsRead') }}</button>
        </header>
        <section>
          <messages
            ref="messages"
            :messages="unreadInChannel(unread.channelID, unread.lastMessageID)"
            :currentUser="$auth.user"
            origin="unreads"
            :scrollable="false"
            v-on="$listeners" />
        </section>
        <hr/>
      </section>
    </main>
    <empty v-else class="empty">{{ $t('message.noUnread') }}</empty>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import Messages from '@/components/Messages'
import Empty from '@/components/Empty'

export default {
  components: {
    Messages,
    Empty,
  },

  computed: {
    ...mapGetters({
      // @todo unread -- port this
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
    this.$store.commit('channels/setCurrent', null)
  },

  methods: {
    ...mapActions({
      // @todo unread setChannelUnread: 'unread/setChannel',
    }),

    loadUnreadMessages () {
      this.unreadChannels.forEach(u => {
        // BUG: firstMessageID not available yet!
        this.$store.dispatch('history/load', { channelID: u.channelID, firstMessageID: u.lastMessageID })
      })
    },

    markAsRead ({ channelID, lastReadMessageID }) {
      this.$bus.$emit('message.markAsLastRead', { channelID, lastReadMessageID })
      this.$store.commit('unread/unset', { channelID, lastReadMessageID })
    },

    markAllAsRead () {
      this.unreadChannels.forEach(this.markAsRead)
    },
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

.header {
  span {
    font-size: 13px;
    font-family: $crustheavy;
    font-weight: bold;
  }
  .title {
    display: inline-block;
    padding-top: 15px;
  }
}

.empty {
  text-align: center;
  margin-top: 30px;
}

.channel-unread {
  font-size: 13px;
  font-weight: 900;
  padding: 10px 20px;
}

.btn {
  float: right;
  margin-top: 15px;
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

@media (min-width: $wideminwidth)
{
  .channel-toggle
  {
    display:none;
  }
}
</style>
