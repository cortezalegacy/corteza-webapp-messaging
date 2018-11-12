<template>
  <aside class="menu-layer noborder">
    <header>
      <h1><slot name="header"></slot></h1>
      <h2><slot name="subtitle"></slot></h2>
      <label class="closer"
             @click="$emit('close')"
             aria-label="Close"><i class="icon-close"></i></label>
    </header>
    <main><slot name="main"></slot></main>
  </aside>
</template>
<style scoped lang="scss">
//inlude generic definitions
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/menu-layer.scss';

aside.menu-layer {
  margin: 0;
  overflow: hidden;
  height: 100vh;
  width: 360px;
  right:0;
  left:auto;
  border-left: solid 1px $defaultlinecolor;
  ul{
    padding-top: 10px;
  }
}

header {
  min-height:60px;
  padding:10px;
  box-shadow: 0 0.1em 0.2em 0 rgba($defaulttextcolor, 0.1);
  margin-bottom:5px;
  top: 0px;
  width: 100%;

  .closer {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 30px;
    z-index: 9999;
  }

  h1 {
    margin: 0;
    font-size: 18px;
  }

  h2 {
    margin: 0;
    font-size: 12px;
    color: $appgrey;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

</style>
