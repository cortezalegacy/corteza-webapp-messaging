<template>
  <li
    class="suggestion channel"
    :class="{
      [suggestion.channel.type]: true,
      selected: index === selection,
    }"
    @click="onClick"
  >
    <span class="channel-name ">
      {{ suggestion.value }}
    </span>
  </li>
</template>

<script>
import base from './base'

export default {
  extends: base,
}
</script>

<style lang="scss" scoped>
@import './shared.scss';

// User's icon increases item's height - this is to make it consistent
.channel {
  min-height: 33px;
  display: flex;
  align-items: center;
}

</style>
