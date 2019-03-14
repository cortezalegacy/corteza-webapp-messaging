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
    user: Object,
    required: true,
  },

  computed: {
    ...mapGetters({ findByID: 'users/findByID', isPresent: 'users/isPresent' }),

    stored () { return this.findByID(this.user.ID) || {} },

    img () { return this.stored.avatar || this.$t('general.label.na') },

    initials () {
      if (this.stored) {
        if (this.stored.name) {
          return this.stored.name[0]
        }

        if (this.stored.username) {
          return this.stored.username[0]
        }
      }

      return '?'
    },

    title () {
      if (!this.stored) {
        return this.stored.name || this.stored.username
      }

      return this.$t('general.label.na')
    },

    isOnline () {
      return !!this.isPresent(this.user.ID)
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
