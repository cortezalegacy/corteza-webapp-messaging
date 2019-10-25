<template>
  <span>
    <span v-if="!inConfirmation">
      <button
        class="btn"
        :class="btnClass"
        :disabled="disabled"
        @click="inConfirmation=true"
      >{{ cta }}</button>
    </span>
    <span v-if="inConfirmation">
      <button
        class="btn"
        :class="btnClass"
        @click="onConfirmation()"
      >{{ $t('general.label.yes') }}</button>
      <button
        class="btn"
        @click="inConfirmation=false"
      >{{ $t('general.label.cancel') }}</button>
    </span>
  </span>
</template>
<script>
export default {
  props: {
    cta: {
      type: String,
      default: undefined,
    },
    ctaClass: {
      type: String,
      default: 'danger',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: undefined,
    },
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
@import 'corteza-webapp-messaging/src/themes/corteza-base/btns.scss';
</style>
