<template>
  <div v-if="getThreads.length > 0">
    <header>
      <b>[WIP] Threads</b>
    </header>

    <main>
      <section v-for="(thread) in getThreads" :key="thread.ID">
        <section>
          <messages
            ref="messages"
            :messages="getThread(thread.ID)"
            :currentUser="currentUser"
            origin="threads"
            :scrollable="false"
            v-on="$listeners" />
        </section>
        <hr/>
      </section>
    </main>
  </div>
  <empty v-else>No threads found</empty>
</template>
<script>
import { mapGetters } from 'vuex'
import Messages from '@/components/Messages'
import Empty from '@/components/Empty'

export default {
  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
      getThreads: 'history/getThreads',
      getThread: 'history/getThread',
    }),
  },

  mounted () {
    this.$ws.getThreads()
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
