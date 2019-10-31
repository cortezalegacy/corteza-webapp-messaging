<template>
  <div class="activity">
    <template v-if="users.length > 0">
      <!-- If over the limit, show only first x activities -->
      <template v-if="users.length > limit">
        {{ $t('message.activity.activityOverflow', { userList: stringify(limit), count: users.length - limit, activity }) }}
      </template>

      <!-- Show all activities -->
      <template v-else-if="users.length > 1">
        {{ $t('message.activity.activityMultiple', { userList: stringify(users.length), activity }) }}
      </template>

      <!-- Show single user -->
      <template v-else>
        {{ $t('message.activity.activityOne', { user: stringify(1), activity }) }}
      </template>
    </template>
  </div>
</template>

<script>
/**
 * Component represents user activities, such as user X is typing.
 * Activity related display should go here.
 */
export default {
  props: {
    users: {
      type: Array,
      required: true,
      default: () => [],
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

  methods: {
    /**
     * Helper function to stringify a given activity subset
     * @param {Number} lim Subset's size
     * @returns {String}
     */
    stringify (lim) {
      return this.users.slice(0, lim).map(u => this.getLabel(u)).join(', ')
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
