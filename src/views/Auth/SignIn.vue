<template>
  <div>
    <header></header>
    <main>
      <a class="btn btn-green" :href="oidc">Login</a>
    </main>
    <footer></footer>
  </div>
</template>

<script>
export default {
  data () {
    return {
      oidc: this.$system.baseURL() + '/oidc',
    }
  },

  mounted () {
    this.$system.authCheck().then((check) => {
      this.$store.commit('auth/setUser', check.user)
      this.$router.push({ name: 'root' })
    }).catch((error) => {
      this.$store.commit('auth/clean')
      console.error(error)
    })
  },
}
</script>
<style lang="scss" scoped>
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/btns.scss';

div {
  background-color: $appcream;
  dispaly: flex;
  text-align: center;
  height: 100vh;

  header {
    background: url('../../assets/images/crust-logo-with-tagline.png') no-repeat;
    background-position: 50% 100%;
    height: 30vh;
  }

  main {
    height: 40vh;
  }

  a {
    padding: 50px;
    font-size: 20px;
    text-decoration: none;
  }
}
</style>
