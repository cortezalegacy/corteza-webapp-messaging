<template>
  <a
    :class="{ 'current-user': highlight && ID === $auth.user.userID }"
    class="mention"
    @click.prevent
    @click="$parent.$emit('mentionSelect', { userID: ID, type: 'user' })"
  >
    @{{ (label || ID).trim() }}
  </a>
</template>

<script>
export default {
  props: {
    ID: {
      type: String,
      required: true,
    },
    highlight: {
      type: Boolean,
      default: true,
    },
    canCreateGroupChannel: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      required: false,
      default: undefined,
    },
  },

}
</script>

<style scoped lang="scss">
.mention {
  color: $dark;
  font-weight: 900;
  text-decoration: none;
  cursor: pointer;

  &.current-user{
    color: $primary;
  }
}
</style>
