<template>
  <li
    class="suggestion"
    :class="{
      [suggestion.user.type]: true,
      selected: index === selection,
    }"
    @click="onClick"
  >
    <span
      class="user group"
      :class="{
        'full-moon': suggestion.online,
        'new-moon': !suggestion.online,
        member: suggestion.member,
      }"
    >

      <span class="channel-name">
        <span class="label">
          {{ suggestion.value }}
        </span>
      </span>
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

</style>
