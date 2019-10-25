<template>
  <div class="embedded-frame">
    <iframe
      type="text/html"
      width="100%"
      height="265"
      frameborder="0"
      allowfullscreen
      :src="src"
    />
  </div>
</template>

<script>
export default {
  props: {
    src: {
      type: String,
      required: true,
      default: '',
    },
  },
}
</script>

<style scoped>
.embedded-frame p {
  margin: 0 0 10px 0;
}

</style>
