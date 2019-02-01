<script>
export default {
  beforeCreate () {
    this.$system.authLogout().catch((err) => {
      console.error(err)
    }).finally(() => {
      this.$store.commit('auth/clean')
    })
    this.$router.push({ name: 'signin' })
  },
}
</script>
