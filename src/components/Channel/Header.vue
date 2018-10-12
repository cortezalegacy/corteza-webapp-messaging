<template>
  <header class="header sub-header">
    <label
      class="channel-toggle"
      @click="toggleChannelPanel()">
      <i class="icon-menu4"></i></label>

    <div class="channel-n-topic">
      <strong v-if="channel.name" class="channel-name">{{ channel.name }}</strong>
      <span  v-if="channel.topic" class="badge badge-blue">{{ channel.topic }}</span>
    </div>

    <div class="channel-toolbox">
      <label
        class="tool"
        @click="$router.push({name: 'members', params: {channelID: channel.ID}})">
        <i title="Members" aria-label="Members" class="icon icon-user"></i></label>
      <label
        class="tool people"
        @click="toggleUserPanel()">
        <sup class="count">{{ usersCount }}</sup>
        <i title="Users" aria-label="Users" class="icon icon-user2"></i></label>
      <label
        class="tool edit"
        @click="$router.push({name: 'edit-channel', params: {channelID: channel.ID}})">
        <i title="Edit channel info" aria-label="Edit channel info" class="icon icon-info"></i></label>
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
  .channel-n-topic
  {
    max-width:calc(100% - 160px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    float:left;
  }
  //channel toggle is specific to here so no include.
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
  }

  .channel-toolbox
  {
    float:right;
    line-height:50px;
    margin:0;
    padding:0;
  }

  .tool
  {
    display: inline-block;
    margin:0 5px;
    &:last-of-type
    {
      border-right:0;
    }
    &:first-of-type
    {
      border-left:0;
    }
    .count
    {
      color:$appgrey;
      font-size:0.8em;
    }
    .icon
    {
      vertical-align: middle;
      font-size:24px;
      width:24px;
    }
  }

  @media (min-width: $wideminwidth)
  {
    .channel-toggle
    {
      display:none;
    }
  }

</style>
