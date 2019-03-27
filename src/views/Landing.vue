<template>
  <div></div>
</template>

<script>
export default {
  beforeCreate () {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.$router.push({ name: 'mobile' })
    }
  },
}
</script>

<style lang="scss" scoped>
@import '@/assets/sass/_0.commons.scss';

div {
  display: block;
  height: 100vh;
  width: 100%;
  background: url('../assets/images/crust-logo-with-tagline.png') no-repeat #efefef;
  background-position: 50% 50%;
  opacity: 0.25;
}
</style>
