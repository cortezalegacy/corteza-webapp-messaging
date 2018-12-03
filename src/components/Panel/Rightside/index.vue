<template>
  <div class="rightside-panel-container">
    <div class="header">
      <h1><slot name="header"></slot></h1>
      <h2><slot name="subtitle"></slot></h2>
      <label class="closer"
             @click="$emit('close')"
             aria-label="Close"><i class="icon-close"></i></label>
    </div>
    <div class="main">
      <slot name="main"></slot>
    </div>
    <div class="footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
<style scoped lang="scss">
//inlude generic definitions
@import '@/assets/sass/_0.commons.scss';

.rightside-panel-container {
  display: flex;
  flex-flow: column nowrap;
  height: 100vh;
  overflow: hidden;

  & > div.header {
    min-height: 60px;
    padding: 10px 0 0 10px;
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
      font-size: 16px;
    }

    h2 {
      margin: 0;
      font-size: 12px;
      color: $appgrey;
      max-width: 90%;
      overflow: hidden;
    }

    h1, h2 {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
  }

  & > div.main {
    flex: 1 100%;
    overflow-y: auto;
  }

  & > div.footer {

  }
}

@media (max-width: $wideminwidth){
  .rightside-panel-container{
    & > div.header{
      min-height: 50px;
      padding-top: 5px;
    }
  }
}

</style>
