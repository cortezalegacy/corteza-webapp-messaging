<template>
  <div class="lightbox">
    <slot />
  </div>
</template>

<script>
export default {

}
</script>

<style scoped lang="scss">
.lightbox {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: transparentize(black,.2);;
  z-index: 2000;
}

</style>
