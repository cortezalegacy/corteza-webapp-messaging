<!-- template for the user avatar component -->
<template>
  <section v-if="users.length > 0" class="activity">
    <b v-for="(user, i) in users.slice(0, limit)" :key="user.ID" class="user">{{ i > 0 ? ', ' : '' }}{{user | userLabel}}</b>
    <span v-if="users.length > limit"> and {{users.length - limit}} others ... are </span>
    <span v-else-if="users.length > 1"> are </span>
    <span v-else> is </span>
    <slot></slot>
  </section>
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
  },
}
</script>
