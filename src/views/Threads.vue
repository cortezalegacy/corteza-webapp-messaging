<template>
  <div>
    <header class="header">
      <label
        class="channel-toggle"
        @click="$emit('toggleChannelPanel', null)"
      >
        <i class="icon-menu4" /></label>
      <span class="title">{{ $t('channel.allThreads') }}</span>
    </header>
    <main v-if="getThreads.length > 0">
      <section
        v-for="(thread, i) in getThreads"
        :key="i"
      >
        <section>
          <messages
            ref="messages"
            :messages="thread"
            :current-user="$auth.user"
            :origin="{ thread: i }"
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
      {{ $t('channel.noThreads') }}
    </empty>
  </div>
</template>
<script>
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import Empty from 'corteza-webapp-messaging/src/components/Empty'
import users from 'corteza-webapp-messaging/src/mixins/users'
import messages from 'corteza-webapp-messaging/src/mixins/messages'

export default {
  components: {
    Messages,
    Empty,
  },

  mixins: [
    users,
    messages,
  ],

  computed: {
    /**
     * Groups messages into threads
     * @returns {Array<Array<Message>>}
     */
    getThreads () {
      const thr = {}
      this.messages.forEach(msg => {
        if (!msg.replyTo) {
          if (msg.replies > 0) {
            if (!thr[msg.messageID]) {
              thr[msg.messageID] = { topic: undefined, replies: [] }
            }
            thr[msg.messageID].topic = msg
          }
          return
        }

        if (!thr[msg.replyTo]) {
          thr[msg.replyTo] = { topic: undefined, replies: [] }
        }

        thr[msg.replyTo].replies.push(msg)
      })

      return Object.values(thr).filter(({ topic }) => topic).sort(({ topic: a }, { topic: b }) => a.sortKey.localeCompare(b.sortKey)).map(({ topic, replies }) => replies.concat([topic]))
    },
  },

  mounted () {
    // So we don't kill the system
    this.messagesThreadLoad({ limit: 100 })
  },
}
</script>

<style lang="scss" scoped>
  @import 'corteza-webapp-messaging/src/themes/corteza-base/headers.scss';
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
    padding-top: 15px;
  }
}

hr {
  background-color: $secondary;
  height: 1px;
  border: none;
}

.empty {
  text-align: center;
  margin-top: 30px;
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
