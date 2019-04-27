<template>
  <lightbox>
      <header>
          <span class="closer" @click="onClose">&times;</span>
      </header>
      <main class="quick-search">
          <search-input focus="true" v-model="query"
          :placeholder="$t('search.quick.placeholder')"  />
          <ol>
              <li v-if="query && filtered.length===0" class="no-results">
                {{ $t('search.noMatchesFound') }}
              </li>
              <li v-for="i in (query ? filtered : prefered).slice(0, 10)"
                  @click="onClose"
                  :key="i.ID">
                <component :is="i.cmp" :ID="i.ID" ></component>
              </li>
          </ol>
      </main>
      <i18next path="search.quick.footnote" tag="footer">
        <kbd>
          {{ $t('search.quick.shortcut') }}
        </kbd>
      </i18next>
  </lightbox>
</template>

<script>
import { mapGetters } from 'vuex'
import Lightbox from '@/components/Lightboxed/index.vue'
import SearchInput from '@/components/SearchInput'
import emitCloseOnEscape from '@/mixins/emitCloseOnEscape'
import labelsMixin from '@/mixins/labels'

export default {
  components: {
    SearchInput,
    Lightbox,
  },

  mixins: [
    emitCloseOnEscape,
    labelsMixin,
  ],

  data () {
    return {
      query: '',
    }
  },

  computed: {
    ...mapGetters({
      channels: 'channels/list',
      users: 'users/list',
    }),

    filtered () {
      const q = this.query.toLocaleLowerCase()
      return this.queryNames.filter(c => c.name.toLocaleLowerCase().indexOf(q) > -1)
    },

    // List of prefered channels -- ones we're not members of
    prefered () {
      return this.channels.filter(c => c.members.length > 0 && !c.isMember(this.$auth.user.ID))
    },

    channelsAndUsers () {
      const cmp = (type) => (i) => {
        i.cmp = `${type}-link`
        return i
      }

      return [
        ...this.users.filter(i => i.ID !== this.$auth.user.ID).map(cmp('user')),
        ...this.channels.filter(i => i.members.length >= 2).map(cmp('channel')),
      ]
    },

    queryNames () {
      return this.channelsAndUsers.map(i => ({
        ID: i.ID,
        name: this.label(i),
        cmp: i.cmp,
      }))
    },
  },

  methods: {
    onClose () {
      this.$emit('close')
    },

    onSearchSubmit ({ query }) {
      this.search(query)
    },
  },
}
</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';

header {
  height: 50px;
  width: 50vw;

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
form{
  padding-bottom: 3px;
}
main {
  max-height: 70vh;
  width: 90vw;
  background-color: $appwhite;
  margin: 5vh 0 0 5vw;
  padding: 20px 20px 3px;

  ol {
    list-style-type: none;
    margin: 0;
    padding: 0;
    max-height: 60vh;
    overflow: scroll;

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
  text-align: center;
  width: 90vw;
  background-color: $appcream;
  border-top: 2px solid $appgrey;
  margin: 0 0 0 5vw;
  padding: 10px;
  position: fixed;
}

.no-results{
  text-align: center;
  font-size: 18px;
  padding: 20px;
}

@media (min-width: $confortableminwidth)
{
  footer{
    max-width: 50vw;
    margin: 0 0 0 25vw;
  }
  main{
    max-width: 50vw;
    margin: 15vh 0 0 25vw;
  }
}

</style>
