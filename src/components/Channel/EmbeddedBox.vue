<template>
  <div class="embedded-frame">
    <p>
      <a :href="chunk" v-html="chunk" />
    </p>
    <iframe
      type="text/html"
      width="100%"
      height="265"
      frameborder="0"
      allowfullscreen
      :src="src" />

  </div>
</template>

<script>
export default {
  props: {
    chunk: {
      type: String,
      required: true,
      default: '',
    },

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
