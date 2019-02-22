<template>
  <section>
    <label><slot></slot></label>
    <div class="actions">
      <confirmation-toggle v-bind="$props" v-on="$listeners"></confirmation-toggle>
    </div>
  </section>
</template>
<script>
import ConfirmationToggle from './ConfirmationToggle'
export default {
  components: {
    ConfirmationToggle,
  },

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
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/btns.scss';

section {
  label {
    float: left;
  }

  div.actions {
    float: right;
  }
}
</style>
