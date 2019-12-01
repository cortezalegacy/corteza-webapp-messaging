<!-- template for the user avatar component -->
<template>
  <span>
    <i
      class="u-avatar"
      :class="{online: user.online }"
      :style="getStyle"
    >
      <span aria-hidden="true">{{ initials }}</span>
    </i>
  </span>
</template>

<script>
export default {
  name: 'Avatar',
  // require user param
  props: {
    user: {
      type: Object,
      required: true,
    },

    size: {
      type: Number,
      required: false,
      default: 32,
    },
  },

  computed: {
    /**
     * Determines what style the given avatar should have
     * @returns {Object}
     */
    getStyle () {
      return {
        'background-image': this.user.avatar || '',
        width: this.size + 'px',
        height: this.size + 'px',
        'font-size': (this.size / 2) + 'px',
      }
    },

    initials () {
      if (this.user) {
        if (this.user.name) {
          return this.user.name[0]
        }

        if (this.user.username) {
          return this.user.username[0]
        }
      }

      return '?'
    },
  },
}
</script>

<style scoped lang="scss">
.u-avatar
{
  display: inline-flex;
  border:solid 1px $secondary;
  border-radius:100%;
  background:url('/static/pics/no-profile-pic.png') center center no-repeat;
  background-size:contain;
  align-items: center;
  justify-content: center;
  text-align:center;
  font-style:normal;
  background-color:rgba($secondary,0.08);;
  color: $secondary;
  &.online {
    background-color: rgba($success,0.08);
    color: $success;
    border: 1px solid $success;
  }
}
</style>
