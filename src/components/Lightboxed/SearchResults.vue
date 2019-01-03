<template>
  <lightbox>
      <header>
          <span class="closer" @click="onClose">&times;</span>
          <section>
              <search-input :preset="searchQuery" :focus="true" @searchSubmit="onSearchSubmit" />
          </section>
      </header>
      <main>
          <section v-for="(r) in results" :key="r.channel.ID">
              <h2>
                  Results in <channel-link :ID="r.channel.ID" @click="onClose"></channel-link>
              </h2>
              <messages
                  ref="messages"
                  :messages="r.messages"
                  :currentUser="currentUser"
                  :hideActionGoToMessage="false"
                  :hideActionOpenThread="true"
                  :hideActionsMenu="true"
                  :hideReactions="true"
                  :hidePinning="true"
                  :hideBookmarking="true"
                  origin="search"
                  :scrollable="false"
                  v-on="$listeners"
                  class="search-messages"/>
            </section>
      </main>
      <footer></footer>
  </lightbox>
</template>

<script>
import { mapGetters } from 'vuex'
import Lightbox from '@/components/Lightboxed/index.vue'
import SearchInput from '@/components/SearchInput'
import Messages from '@/components/Messages'
import ChannelLink from '@/components/Channel/Link'
import emitCloseOnEscape from '@/mixins/emitCloseOnEscape'

export default {
  props: {
    searchQuery: {
      type: String,
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
      findChannelByID: 'channels/findByID',
    }),
  },

  data () {
    return {
      results: [],
    }
  },

  mounted () {
    this.search(this.searchQuery)
  },

  methods: {
    search (query) {
      this.results = []
      this.$rest.searchMessages(query).then(mm => {
        this.results = this.groupByChannel(mm)
      })
    },

    groupByChannel (mm) {
      let groups = []
      let gindex = {}

      for (let i in mm) {
        const channelID = mm[i].channelID

        if (gindex[channelID] === undefined) {
          const channel = this.findChannelByID(channelID)

          if (!channel) {
            continue
          }

          gindex[channelID] = groups.length
          groups.push({ messages: [], channel })
        }

        groups[gindex[channelID]].messages.push(mm[i])
      }

      return groups
    },

    onClose () {
      this.$emit('close')
    },

    onSearchSubmit (query) {
      this.search(query)
    },
  },

  components: {
    SearchInput,
    Lightbox,
    Messages,
    ChannelLink,
  },

  mixins: [
    emitCloseOnEscape,
  ],
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/_0.declare.scss';

header {
  height: 50px;
  width: 100vw;

  section {
    padding: 10px 70px 0 70px;
  }

  .closer {
    position: fixed;
    color: $appcream;
    float: right;
    font-size: 50px;
    top: 10px;
    right: 30px;
    cursor: pointer;
    line-height: 30px;
  }

}

main {
  height: calc(100vh - 100px);
  background-color: $appwhite;
  margin: 0px 70px 0 70px;
  overflow-x: auto;
  overflow-x: hidden;

  section {
    h2 {
      margin: 16px 20px;
      font-weight: 300;
      font-size: 16px;

      span {
        font-weight: 900;
      }

    }

    padding: 10px 0px;
    border-bottom: 1px solid $tab_bgcolor;
  }

}
.search-messages{
  margin-left: 30px;
}

</style>
