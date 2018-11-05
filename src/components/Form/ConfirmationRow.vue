<!-- template for the user avatar component -->
<template>
  <section>
    <label><slot></slot></label>
    <div class="actions" v-if="!inConfirmation">
      <button class="btn" :class="btnClass" @click="inConfirmation=true" :disabled="disabled">{{cta}}</button>
    </div>
    <div class="actions" v-if="inConfirmation">
      <button class="btn" :class="btnClass" @click="onConfirmation()">Yes</button>
      <button class="btn" @click="inConfirmation=false">Cancel</button>
    </div>
  </section>
</template>
<script>
export default {
  props: {
    cta: String,
    ctaClass: { type: String, default: 'danger' },
    disabled: Boolean,
    error: String,
  },

  computed: {
    btnClass () {
      if (this.disabled) {
        return 'btn-disabled'
      }

      return `btn-${this.ctaClass}`
    },
  },

  data () {
    return {
      inConfirmation: false,
    }
  },

  methods: {
    onConfirmation () {
      this.inConfirmation = false
      this.$emit('confirmed')
    },
  },
}
</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/btns.scss';

section {
  border-top: 1px solid $appgrey;
  font-size: 1.5em;
  padding: 20px 10px 30px 10px;
  margin: 20px;

  label {
    float: left;
  }

  div.actions {
    float: right;
  }
}
</style>
