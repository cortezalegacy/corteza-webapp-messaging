<!-- template for the user avatar component -->
<template>
  <form @submit.prevent="onSubmit">
      <span class="badge badge-block badge-pill badge-tall">
          <i class="icon-search"></i>
          <input
            v-focus="focus"
            ref="input"
            type="text"
            v-model="query"
            :placeholder="placeholder"
            autocomplete="true"
            class="txt no-border">
        <i class="icon-settings-horizontal float-right"></i>
      </span>
  </form>
</template>
<script>
import { focus } from 'vue-focus'

export default {
  props: {
    value: String,
    placeholder: { type: String, default: 'Search' },
    focus: false,
    preset: {
      type: String,
    },
  },

  computed: {
    // making sure value goes from our parent to <input> and back properly...
    query: {
      get () {
        return this.value
      },

      set (value) {
        this.$emit('input', value)
      },
    },
  },

  mounted () {
    this.query = this.preset || ''
  },

  methods: {
    onSubmit (ev) {
      this.$emit('searchSubmit', { query: this.query })
    },
  },

  directives: {
    focus,
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
