<!-- template for the user avatar component -->
<template>
  <form @submit.prevent="onSubmit">
      <span class="badge badge-block badge-pill badge-tall">
          <i class="icon-search"></i>
          <input
            ref="input"
            type="text"
            v-model="query"
            placeholder="Search"
            class="txt no-border">
        <i class="icon-settings-horizontal float-right"></i>
      </span>
  </form>
</template>
<script>
export default {
  props: {
    preset: {
      type: String,
    },
  },

  data () {
    return {
      query: '',
    }
  },

  mounted () {
    this.query = this.preset || ''
  },

  methods: {
    onSubmit (ev) {
      this.$emit('searchSubmit', { query: this.query })
    },
  },
}
</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/badges.scss';
@import '@/assets/sass/inputs.scss';

form  {
  border-right:3px;

  span {
    background: white;

    input {
      width: calc(100% - 40px);
    }
  }
}

</style>
