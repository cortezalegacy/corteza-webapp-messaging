<template>
  <header class="header sub-header">
    <label
      class="channel-toggle"
      @click="toggleChannelPanel()">
      <i class="icon-menu4"></i></label>

    <div class="thread-n-project">
      <strong v-if="channel.name" class="channel-name">{{ channel.name }}</strong>
      <span  v-if="channel.topic" class="badge badge-blue">{{ channel.topic }}</span>
    </div>

    <div class="header-toolbox">
      <label
        class="people"
        @click="toggleUserPanel()">
        <sup class="crust_iam-people_count">{{ usersCount }}</sup>
        <i class="icon-user2"></i></label>
      <label
        class="crust_iam-info"
        @click="$router.push({name: 'edit-channel', params: {channelID: channel.ID}})">
        Edit</label>
      <label
        class="crust_iam-info"
        @click="$router.push({name: 'members', params: {channelID: channel.ID}})">
        Members</label>
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

<style scoped lang="scss">
  @import '@/assets/sass/_0.commons.scss';
  @import '@/assets/sass/badges.scss';
  @import '@/assets/sass/channel-names.scss';
  @import '@/assets/sass/headers.scss';
  // custom styles
  // if i increase channel name, everything should.
  .channel-name
  {
    font-size:13px;
    font-family: $crustheavy;
    font-weight: bold;
  }
  //channel toggle is specific to here so no include.
  .channel-toggle
  {
    font-size:16px;
    float:left;
    line-height:30px;
    width:60px;
    text-align:center;
  }

  @media (min-width: $wideminwidth)
  {
    .channel-toggle
    {
      display:none;
    }
  }

</style>
