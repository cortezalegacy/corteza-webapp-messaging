<!-- template for the user avatar component -->
<template>
  <section v-if="users.length > 0" class="activity">
    <b v-for="(user, i) in users" :key="user.ID" class="user">{{ i > 0 ? ', ' : '' }}{{user | userLabel}}</b>
    <span v-if="users.length == 1"> is </span>
    <span v-else> are </span>
    <slot></slot>
  </section>
</template>

<script>
export default {
  // require user param
  props: {
    users: Array,
    required: true,
  },
}
</script>
