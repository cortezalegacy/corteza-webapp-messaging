<template>
  <nav class="crust_iam-menu crust_sliding_menu">
    <label class="crust_hide-iam-menu crust-closer"
      @click="toggleChannelPanel(false)"><i class="icon-close"><span class="crust_readable_text">close</span></i></label>
    <ul class="crust_main-menu_list" v-if="chatChannels">
      <li class="crust_iam-menu_item"><a>Inbox</a></li>
      <li class="crust_iam-menu_item"><a>Channels</a>
        <ul class="crust_iam-channel_subitems" v-if="chatChannels">
          <li v-for="ch in chatChannels" :key="ch.ID" v-bind:class="['crust_iam-channel_item', {current:(current && (ch === current))}]">
            <router-link :to="{name:'channel', params:{channelID:ch.ID}}">{{name(ch)}}</router-link>
          </li>
        </ul>
      </li>
      <li class="new-channel"><span @click="$router.push({name: 'new-channel'})"><i class="icon-plus"></i>New Channel</span></li>
    </ul>
  </nav>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'panel-channels',
  data () {
    return {
      shown: false,
    }
  },

  computed: {
    ...mapGetters({
      chatChannels: 'channels/list',
      current: 'channels/current',
      findUserByID: 'users/findByID',
    }),
  },

  methods: {
    ...mapActions({
      toggleChannelPanel: 'ui/toggleChannelPanel',
    }),

    name (ch) {
      if (ch.type === 'direct' && ch.members !== undefined && ch.members.length === 2) {
        const u1 = this.findUserByID(ch.members[0])
        const u2 = this.findUserByID(ch.members[1])

        return (u1.username || u1.ID) + ' & ' + (u2.username || u2.ID)
      } else {
        return '#' + (ch.name || ch.ID)
      }
    },
  },
}
</script>

<style scoped>

</style>
