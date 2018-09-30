<!-- template for the user avatar component -->
<template>
  <i name="avatar"
     class="u-avatar"
     :title="user.username"
     :data-uid="user.ID"
     :style="'background-image:url(/static/pics/user'+(user.ID%10)+'.png)'"
     aria-hidden="true"><span>{{ user.username }}</span></i>
</template>

<script>
export default
{
  name: 'avatar',
  // require user param
  props: {
    'user': Object,
    'required': true
  }
}
</script>

<style scoped lang="scss">
//this import is for variables
@import '@/assets/sass/_0.declare.scss';
i.u-avatar
{
  display:inline-block;
  height:3rem;
  width:3rem;
  border:solid 2px $defaultlinecolor;
  border-radius:100%;
  background:url('/static/pics/no-profile-pic.png') center center no-repeat;
  background-size:contain;
  span
  {
    display:none;
  }
}
</style>
