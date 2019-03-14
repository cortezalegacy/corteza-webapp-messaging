<!-- template for the user avatar component -->
<template>
    <span v-if="users.length > 0" class="typing">
      <template v-if="users.length > limit">
        {{ $t('message.activity.activityOverflow', { userList: users.slice(0, limit).map(u => label(u)).join(', '), count: users.length - limit, activity }) }}
      </template>
      <template v-else-if="users.length > 1">
        {{ $t('message.activity.activityMultiple', { userList: users.map(u => label(u)).join(', '), activity }) }}
      </template>
      <template v-else>
        {{ $t('message.activity.activityOne', { user: label(users[0]), activity }) }}
      </template>
    </span>
</template>
<script>
export default {
  // require user param
  props: {
    users: {
      type: Array,
      required: true,
    },

    limit: {
      type: Number,
      required: false,
      default: 4,
    },
    activity: {
      type: String,
      required: true,
    },
  },
}
</script>
<style lang="scss" scoped>
  .typing {
    position: absolute;
    margin-top: 2px;
  }
</style>
