<!-- template for the user avatar component -->
<template>
  <i v-if="user" class="u-avatar"
     :title="title()"
     :style="img()?'background-image:'+img():''">
      <span aria-hidden="true">{{ initials()}}</span>
  </i>
  <i v-else
     class="u-avatar coward">
      <span aria-hidden="true">?</span>
  </i>
</template>

<script>
export default
{
  name: 'avatar',
  // require user param
  props: {
    'user': Object,
    'required': true,
  },

  data () {
    return {
      img: () => {
        if (!this.user) {
          return ''
        }

        return this.user.avatar
      },

      initials: () => {
        if (this.user) {
          if (this.user.name) {
            return this.user.name[0]
          }

          if (this.user.username) {
            return this.user.username[0]
          }
        }
      },

      title: () => {
        if (!this.user) {
          return ''
        }

        return this.user.name || this.user.username
      },
    }
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
</style>
