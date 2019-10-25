<template>
  <section>
    <label><slot /></label>
    <div class="actions">
      <confirmation-toggle
        v-bind="$props"
        v-on="$listeners"
      />
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

section {
  label {
    float: left;
  }

  div.actions {
    float: right;
  }
}
</style>
