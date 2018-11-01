<template>
  <lightbox>
      <header>
          <span class="closer" @click="onClose">&times;</span>
          <section>
              <search-input :preset="searchQuery" @searchSubmit="onSearchSubmit" />
          </section>
      </header>
      <main>
          <section v-for="(r) in results" :key="r.channel.ID">
              <h2>
                  Results in #<channel-name :channel="r.channel"></channel-name>
              </h2>
              <messages
                  ref="messages"
                  :messages="r.messages"
                  :currentUser="currentUser"
                  origin="search"
                  :scrollable="false" />
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

    onSearchSubmit ({ query }) {
      this.search(query)
    },
  },

  components: {
    SearchInput,
    Lightbox,
    Messages,
  },

  mixins: [
    emitCloseOnEscape,
  ],
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

header {
  height: 50px;
  width: 100vw;

  section {
    padding: 10px 70px 0 15px;
  }

  .closer {
    position: fixed;
    color: $appcream;
    float: right;
    font-size: 50px;
    font-weight: bold;
    top: 10px;
    right: 30px;
    cursor: pointer;
    line-height: 30px;
  }
}

main {
  height: calc(100vh - 100px);
  background-color: $appcream;
  margin: 10px 70px 0 15px;
  border-radius: 5px;
  overflow-x: auto;
  overflow-x: hidden;

  section {
    h2 {
      margin: 16px 20px;
    }

    padding: 16px 0px;
    border-bottom: 2px solid $appgrey;
  }
}


</style>
