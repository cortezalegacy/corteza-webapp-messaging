<!-- template for the user avatar component -->
<template>
  <form @submit.prevent="$emit('searchSubmit', query)">
    <span class="badge badge-block">
      <i class="icon-search" />
      <input
        ref="input"
        v-model="query"
        v-focus="focus"
        type="text"
        :placeholder="getPlaceholder"
        autocomplete="true"
        class="txt no-border"
      >
    </span>
  </form>
</template>
<script>
import { focus } from 'vue-focus'

export default {
  directives: {
    focus,
  },

  props: {
    value: {
      type: String,
      default: undefined,
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    focus: {
      type: Boolean,
      default: false,
    },
    preset: {
      type: String,
      default: undefined,
    },
  },

  data () {
    return {
      internalValue: this.preset,
    }
  },

  computed: {
    // making sure value goes from our parent to <input> and back properly...
    query: {
      get () {
        return this.internalValue
      },

      set (value) {
        this.internalValue = value
        this.$emit('input', value)
      },
    },

    getPlaceholder () {
      return this.placeholder || this.$t('general.label.search')
    },
  },
}
</script>
<style scoped lang="scss">
@import 'corteza-webapp-messaging/src/themes/corteza-base/inputs.scss';

form  {
  border-right:3px;

  span {
    background: white;

    input {
      width: calc(100% - 40px);
    }
  }
  .badge {
    border-radius: 0;
  }
}

.badge {
  font-size:12px;
  line-height:1;
  display:inline-block;
  border: solid 1px $secondary;
  color: $secondary;
  padding:0.25em 1em;
  border-radius:1.5em;
  text-decoration: none;
  margin:0 0.5em;
  transition: color 0.2s, background-color 0.2s;
  [class^="icon-"],
  [class*=" icon-"],
  a {
    text-decoration: none;
    color: $secondary;
  }
  [class^="icon-"],
  [class*=" icon-"] {
    display:inline-block;
    margin-right:3px;
    margin-top:0.2em;
  }
}

.badge-block {
  display:block;
  margin:0;
}

</style>
