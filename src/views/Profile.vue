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

    this.$MessagingAPI.channelCreate({ type: 'group', members: [this.userID] }).then((ch) => {
      this.$router.push({ name: 'channel', params: { channelID: ch.channelID } })
    }).catch(({ error }) => {
      console.error(error)
    })
  },
}
</script>
