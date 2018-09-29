<template>
  <div class="lightbox">
    <slot />
  </div>
</template>

<script>
export default {

}
</script>

<style scoped>
.lightbox {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: #1e1e1e36;
  z-index: 1000;
}

</style>
