<template>
  <div></div>
</template>
<script>
export default {
  props: {
    userID: String,
    required: true,
  },

  beforeMount () {
    // Only creating messaging channel in the background and redirecting user...
    // later this can be extended to actual profile page

    this.$messaging.channelCreate({ type: 'group', members: [this.userID] }).then((ch) => {
      console.debug('Direct message channel created', ch)
      this.$router.push({ name: 'channel', params: { channelID: ch.cannelID } })
    }).catch(({ error }) => {
      console.error(error)
    })
  },
}
</script>
