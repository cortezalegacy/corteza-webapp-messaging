<template>
  <div class="header sub-header">
    <label
      class="channel-toggle"
      @click="$emit('toggleChannelPanel', null)">
      <i class="icon-menu4"></i></label>

    <div class="channel-n-topic">
      <strong v-if="channel.name" class="channel-name">{{ channel.name }}</strong>
      <span  v-if="channel.topic" class="topic badge badge-blue">
        {{ channel.topic }}
      </span>
    </div>

    <div class="channel-toolbox">
      <label
        class="tool"
        @click="$emit('openMembersPanel')">
        <sup class="count">{{ channel.members.length }}</sup>
        <i title="Members" aria-label="Members" class="icon icon-user"></i></label>

      <label
        class="tool"
        @click="$router.push({name: 'edit-channel', params: {channelID: channel.ID}})">
        <i title="Edit channel info" aria-label="Edit channel info" class="icon icon-edit-3 edit"></i>
      </label>
      <label
        @click="$emit('openPinnedMessagesPanel')">
          <font-awesome-icon
            icon="thumbtack"
            title="Open pinned messages"
          ></font-awesome-icon>
      </label>
      <label
        @click="$emit('openBookmarkedMessagesPanel')">
          <font-awesome-icon
            :icon="['far', 'bookmark']"
            title="Open bookmarks"
          ></font-awesome-icon>
      </label>
    </div>
  </div>
</template>
<script>
export default {
  name: 'channel-header',

  props: {
    channel: {
      type: Object,
      required: true,
    },
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
    max-width:calc(100% - 200px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    float:left;
  }

  // channel toggle is specific to here so no include.
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
    padding-top:5px;
  }

  .channel-toolbox, .messaging-toolbox {
    float:right;
    line-height:35px; // the folding breaks line height
    margin:0;
    padding:0;
    margin-top:5px;
  }

  .messaging-toolbox {
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

  .svg-inline--fa{
    padding: 4px;
    width: 25px;
    height: 25px;
    border: 1px solid $appgrey;
    margin-bottom: -8px;
    border-radius: 50px;
    color: $appgrey;
    margin-right: 5px;
  }

  .edit{
    border-right: 1px solid #90A3B1;
    padding-right: 10px;
    margin-right: 5px;
  }
  .topic{
    margin-bottom: 20px;
  }

  @media (max-width: $wideminwidth - 1)
  {
    // in our case the label should not be one line on mobile
    .channel-n-topic
    {
      margin-top:0.5em;
      line-height: 1.5em;
    }
    .topic
    {
      display:block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .channel-name
    {
      vertical-align: bottom;
    }
  }

  @media (min-width: $wideminwidth)
  {
    .channel-n-topic
    {
      width:calc(100% - 160px);
    }
    .channel-name, .topic
    {
      display:inline-block;
      max-width:45%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .channel-toggle
    {
      display:none;
    }
    .channel-toolbox, .messaging-toolbox
    {
      margin-top:0;
      line-height:5em; // the folding breaks line height
    }
  }

</style>
