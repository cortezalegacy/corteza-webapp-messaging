<template>
  <header class="crust_iam-header">
    <label class="crust_iam_show_threads" @click="toggleChannelPanel()"><i class="icon-menu4"></i></label>
    <div class="crust_iam_thread_n_project">
      <strong v-if="channel.name" class="crust_iam-thread">#{{ channel.name }}</strong>
      <span  v-if="channel.topic" class="crust_iam-project">{{ channel.topic }}</span>
    </div>
    <div class="crust_iam-header_toolbox">
      <label
        class="crust_iam-people"
        @click="toggleUserPanel()"><sup class="crust_iam-people_count">{{ usersCount }}</sup><i class="icon-user2"></i></label>
    <label
            class="crust_iam-info"
            @click="$router.push({name: 'edit-channel', params: {channelID: channel.ID}})">Edit</label>
    <label
            class="crust_iam-info"
            @click="$router.push({name: 'members', params: {channelID: channel.ID}})">Members</label>
    </div>
  </header>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'channel-header',

  props: [ 'channel' ],

  computed: {
    ...mapGetters({
      ch: 'channels/current',
      usersCount: 'users/length',
    }),
  },

  methods: {
    ...mapActions({
      toggleChannelPanel: 'ui/toggleChannelPanel',
      toggleUserPanel: 'ui/toggleUserPanel',
    }),
  },
}
</script>
