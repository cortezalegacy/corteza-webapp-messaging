<!-- template for the user avatar component -->
<template>
  <span>
    <i class="u-avatar"
       :title="title"
       :class="{online: isOnline }"
       :style="img?'background-image:'+img:''">
      <span aria-hidden="true">{{ initials }}</span>
    </i>
  </span>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'avatar',
  // require user param
  props: {
    userID: {
      type: String,
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      findByID: 'users/findByID',
      isPresent: 'users/isPresent',
    }),

    user () {
      return this.findByID(this.userID) || {}
    },

    img () {
      return this.user.avatar || this.$t('general.label.na')
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

    title () {
      if (!this.user) {
        return this.user.name || this.user.username
      }

      return this.$t('general.label.na')
    },

    isOnline () {
      return !!this.isPresent(this.userID)
    },
  },
}
</script>

<style scoped lang="scss">
//this import is for variables
@import '@/assets/sass/_0.declare.scss';
.u-avatar
{
  display:inline-block;
  font-size:16px;
  height:32px;
  width:32px;
  border:solid 1px $defaultlinecolor;
  border-radius:100%;
  background:url('/static/pics/no-profile-pic.png') center center no-repeat;
  background-size:contain;
  line-height:28px;
  text-align:center;
  font-style:normal;
  background-color:rgba($appgrey,0.08);;
  color:$appgrey;
  &.online {
    background-color: rgba($appgreen,0.08);
    color: $appgreen;
    border: 1px solid $appgreen;
  }
}
</style>
