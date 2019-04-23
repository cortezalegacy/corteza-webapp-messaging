<template>
  <div>
    <header class="header">
      <label
        class="channel-toggle"
        @click="$emit('toggleChannelPanel', null)">
        <i class="icon-menu4"></i></label>
      <span class="title">{{ $t('channel.allThreads') }}</span>
    </header>
    <main v-if="getThreads.length > 0">
      <section v-for="(thread) in getThreads" :key="thread.ID">
        <section>
          <messages
            ref="messages"
            :messages="getThread(thread.ID)"
            :currentUser="$auth.user"
            origin="threads"
            :scrollable="false"
            v-on="$listeners" />
        </section>
        <hr/>
      </section>
    </main>
    <empty v-else class="empty">{{ $t('channel.noThreads') }}</empty>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import Messages from '@/components/Messages'
import Empty from '@/components/Empty'

export default {
  components: {
    Messages,
    Empty,
  },

  computed: {
    ...mapGetters({
      getThreads: 'history/getThreads',
      getThread: 'history/getThread',
    }),
  },

  mounted () {
    this.$ws.getThreads()
    this.$store.dispatch('channels/setCurrent', null)
  },
}
</script>

<style lang="scss" scoped>
  @import '@/assets/sass/headers.scss';
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
    padding-top: 15px;
  }
}

hr {
  background-color: $appgrey;
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
