<template>
  <!-- Temporary component. Later this will most likely be moved to a quill plugin -->
  <div class="picker">
    <img
      v-for="gif in gifs"
      :key="gif.id"
      :src="gif.previewUrl"
      class="gif"
      v-on="$listeners"
      @click="$emit('pick', gif)" />

  </div>
</template>

<script>
export default {
  props: {
    gifs: {
      type: Array,
      default: () => [],
    },
  },
}
</script>

<style lang="scss" scoped>
@import '@/assets/sass/_0.declare.scss';
.picker {
  transform: translateY(-100%);
  position: absolute;
  width: 100%;
  background-color: $mainbgcolor;
  box-shadow: 0 0 3px rgba($black, 0.4);
  overflow-x: scroll;
  display: flex;
  overflow-y: hidden;
  padding: 5px 0;

  .gif {
    cursor: pointer;
    height: 100px;
    width: 100%;
    margin-right: 5px;
    &:last-of-type {
      margin-right: 0;
    }
  }
}

</style>
