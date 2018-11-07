<template>
  <lightbox>
      <header>
          <span class="closer" @click="onClose">&times;</span>
      </header>
      <main>
          <search-input focus="true" v-model="query" placeholder="Find channel, group or user..."  />
          <ol>
              <li v-for="c in (query ? filtered : prefered).slice(0, 10)"
                  @click="onClose"
                  :key="c.ID">
                <channel-link :ID="c.ID" ></channel-link>
              </li>
          </ol>
      </main>
      <footer>
        Search and select one of the channels. Close (and open) this dialog with <kbd>CTRL/CMD+K</kbd>
      </footer>
  </lightbox>
</template>

<script>
import { mapGetters } from 'vuex'
import Lightbox from '@/components/Lightboxed/index.vue'
import SearchInput from '@/components/SearchInput'
import emitCloseOnEscape from '@/mixins/emitCloseOnEscape'

export default {
  computed: {
    ...mapGetters({
      currentUser: 'auth/user',
      channels: 'channels/list',
    }),

    filtered () {
      return this.channels.filter(c => c.name.indexOf(this.query) > -1)
    },

    // List of prefered channels -- ones we're not members of
    prefered () {
      return this.channels.filter(c => c.members.length > 0 && !c.isMember(this.currentUser.ID))
    },
  },

  data () {
    return {
      query: '',
    }
  },

  methods: {
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
  width: 50vw;

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
  height: 40vh;
  width: 50vw;
  background-color: $appwhite;
  margin: 15vh 0 0 25vw;

  ol {
    list-style-type: none;
    margin: 0;
    padding: 0;

    li {
      margin: 0;
      padding: 0;

      a {
        padding: 10px 20px;
        display: block;

        &:hover {
          background: $appcream;
        }
      }
    }
  }
}

footer {
  width: 50vw;
  background-color: $appcream;
  margin: 0 0 0 25vw;
  color: $appgrey;
  padding: 5px;

}

</style>
