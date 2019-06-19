<template>
  <span>
    <span v-if="!inConfirmation">
      <button class="btn" :class="btnClass" @click="inConfirmation=true" :disabled="disabled">{{cta}}</button>
    </span>
    <span v-if="inConfirmation">
      <button class="btn" :class="btnClass" @click="onConfirmation()">{{ $t('general.label.yes') }}</button>
      <button class="btn" @click="inConfirmation=false">{{ $t('general.label.cancel') }}</button>
    </span>
  </span>
</template>
<script>
export default {
  props: {
    cta: String,
    ctaClass: { type: String, default: 'danger' },
    disabled: Boolean,
    error: String,
  },

  data () {
    return {
      inConfirmation: false,
    }
  },

  computed: {
    btnClass () {
      if (this.disabled) {
        return 'btn-disabled'
      }

      return `btn-${this.ctaClass}`
    },
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
@import '@/assets/sass/btns.scss';
</style>
