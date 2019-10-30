<!-- template for the user avatar component -->
<template>
  <div class="activity">
    <template v-if="users.length > 0">
      <!-- Show first x users -->
      <template v-if="users.length > limit">
        {{ $t('message.activity.activityOverflow', { userList: users.slice(0, limit).map(u => getLabel(u)).join(', '), count: users.length - limit, activity }) }}
      </template>

      <!-- Show all activities -->
      <template v-else-if="users.length > 1">
        {{ $t('message.activity.activityMultiple', { userList: users.map(u => getLabel(u)).join(', '), activity }) }}
      </template>

      <!-- Show single user -->
      <template v-else>
        {{ $t('message.activity.activityOne', { user: getLabel(users[0]), activity }) }}
      </template>
    </template>
  </div>
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
  .activity {
    min-height: 30px;
    margin-top: 2px;
  }
</style>
