<!-- template for the user avatar component -->
<template>
  <i class="u-avatar"
     :title="title"
     :class="{online: isOnline }"
     :style="img?'background-image:'+img:''">
      <span aria-hidden="true">{{ initials }}</span>
  </i>
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
    ...mapGetters({ findByID: 'users/findByID' }),

    stored () { return this.findByID(this.user.ID) || {} },

    img () { return this.stored.avatar || 'N/A' },

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

      return 'N/A'
    },

    isOnline () { return this.stored.connections > 0 },
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
  border:solid 2px $defaultlinecolor;
  border-radius:100%;
  background:url('/static/pics/no-profile-pic.png') center center no-repeat;
  background-size:contain;
  line-height:28px;
  text-align:center;
  font-style:normal;
  background-color:$appgrey;
  color:$appwhite;
}
.coward
{
  background-color:rgba($appgrey,0.5);
  border-color:rgba($defaultlinecolor,0.15);
}
.online:before {
  content: '●';
  font-weight: bold;
  color: lighten($appgreen,0.55);
  position: absolute;
  font-size: 26px;
  margin-top: -12px;
  margin-left: 12px;
}
</style>
