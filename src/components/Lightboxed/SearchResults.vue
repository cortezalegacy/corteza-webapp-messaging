<template>
  <lightbox>
    <header>
      <span
        class="closer"
        @click="onClose"
      >&times;</span>
      <section>
        <search-input
          :preset="searchQuery"
          :focus="true"
          @searchSubmit="onSearchSubmit"
        />
      </section>
    </header>
    <main>
      <section
        v-for="(r) in results"
        :key="r.channel.channelID"
      >
        <i18next
          path="search.searchResultsIn"
          tag="h2"
        >
          <channel-link
            :i-d="r.channel.channelID"
            :users="users"
            @click="onClose"
          />
        </i18next>
        <messages
          ref="messages"
          :messages="r.messages"
          :users="users"
          :current-user="$auth.user"
          :hide-action-go-to-message="false"
          :hide-action-open-thread="true"
          :hide-actions-menu="true"
          :hide-pinning="true"
          :hide-mark-as-unread="true"
          :hide-bookmarking="true"
          :origin="{ type: 'search' }"
          :scrollable="false"
          class="search-messages"
          v-on="$listeners"
        />
      </section>
    </main>
    <footer />
  </lightbox>
</template>

<script>
import { mapGetters } from 'vuex'
import Lightbox from 'corteza-webapp-messaging/src/components/Lightboxed/index.vue'
import SearchInput from 'corteza-webapp-messaging/src/components/SearchInput'
import Messages from 'corteza-webapp-messaging/src/components/Messages'
import ChannelLink from 'corteza-webapp-messaging/src/components/Channel/Link'
import emitCloseOnEscape from 'corteza-webapp-messaging/src/mixins/emitCloseOnEscape'
import { Message } from 'corteza-webapp-messaging/src/types'
import users from 'corteza-webapp-messaging/src/mixins/users'
import messages from 'corteza-webapp-messaging/src/mixins/messages'

export default {
  components: {
    SearchInput,
    Lightbox,
    Messages,
    ChannelLink,
  },

  mixins: [
    emitCloseOnEscape,
    users,
    messages,
  ],

  props: {
    searchQuery: {
      type: String,
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      findChannelByID: 'channels/findByID',
    }),

    /**
     * Groups messages under their channels
     * @returns {Array<Object>}
     */
    results () {
      return this.groupByChannel(this.messages)
    },
  },

  watch: {
    results: {
      handler: function (rr) {
        this.getUsers(rr.map(({ channel }) => channel))
      },
      deep: true,
    },
  },

  mounted () {
    this.search(this.searchQuery)
  },

  methods: {
    search (query) {
      this.messagesLoad({
        filter: { query },
        noCheck: true,
        resetState: true,
      })
    },

    groupByChannel (mm) {
      let groups = []
      let gindex = {}

      for (const message of mm) {
        const { channelID } = message

        if (gindex[channelID] === undefined) {
          const channel = this.findChannelByID(channelID)

          if (!channel) {
            continue
          }

          gindex[channelID] = groups.length
          groups.push({ messages: [], channel })
        }

        groups[gindex[channelID]].messages.push(new Message({ ...message, userID: message.userID }))
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
}
</script>

<style scoped lang="scss">

header {
  height: 50px;
  width: 100vw;

  section {
    padding: 10px 70px 0 70px;
  }

  .closer {
    position: fixed;
    color: $light;
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
  background-color: $white;
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
    border-bottom: 1px solid $light;
  }

}
.search-messages{
  margin-left: 30px;
}

</style>
