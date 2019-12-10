<template>
  <li
    class="suggestion user"
    :class="{
      selected: index === selection,
    }"
    @click="onClick"
  >
    <span
      class="user group float-left"
      :class="{
        member: $attrs.query && suggestion.member,
        'full-moon': suggestion.online,
        'new-moon': !suggestion.online,
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
