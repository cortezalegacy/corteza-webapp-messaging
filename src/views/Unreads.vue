<template>
  <div>
    <header class="header sub-header">
      <label
        class="channel-toggle"
        @click="$emit('toggleChannelPanel', null)"
      >
        <i class="icon-menu4" /></label>

      <span class="title">{{ $t('message.unread') }}</span>
      <button
        class="btn"
        @click="markAllAsRead()"
      >
        {{ $t('message.markAllAsUnread') }} [@todo]
      </button>
    </header>
    <main v-if="unreadChannels && unreadChannels.length > 0">
      <section
        v-for="unread in getUnreadChannels"
        :key="unread.channelID"
      >
        <header class="channel-unread">
          {{ labelChannel(unread.channelID) }} ({{ unread.count }})
          <button
            class="btn"
            @click="markAsRead(unread)"
          >
            {{ $t('message.markAsRead') }}
          </button>
        </header>
        <section>
          <messages
            ref="messages"
            :messages="unreadInChannel(unread.channelID, unread.lastMessageID)"
            :current-user="$auth.user"
            origin="unreads"
            :scrollable="false"
            v-on="$listeners"
          />
        </section>
        <hr>
      </section>
    </main>
    <empty
      v-else
      class="empty"
    >
      {{ $t('message.noUnread') }}
    </empty>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import Empty from 'corteza-webapp-messaging/src/components/Empty'
import { messagesLoad } from 'corteza-webapp-messaging/src/lib/messenger'

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

    getUnreadChannels () {
      return this.unreadChannels.filter(u => this.findChannelByID(u.channelID))
    },
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
      // @todo unread setChannelUnread: 'unread/setChannel',
    }),

    loadUnreadMessages () {
      if (!this.unreadChannels) return

      this.unreadChannels.forEach(u => {
        messagesLoad(this.$MessagingAPI, this.$store.getters['users/findByID'], { channelID: u.channelID, fromMessageID: u.lastMessageID }).then((msgs) => {
          this.$store.commit('history/updateSet', msgs)
        })
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
  @import 'corteza-webapp-messaging/src/themes/corteza-base/headers.scss';
  @import 'corteza-webapp-messaging/src/themes/corteza-base/btns.scss';
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
    font-family: $bold;
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
  background-color: $white;
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
