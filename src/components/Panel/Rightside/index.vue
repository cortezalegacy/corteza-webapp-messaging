<template>
  <div
    class="rightside-panel-container"
    v-on="$listeners"
  >
    <div class="header">
      <span class="title"><slot name="header" /></span>
      <span class="subtitle"><slot name="subtitle" /></span>
      <label
        class="closer"
        @click="$emit('close')"
      ><i class="icon-x" /></label>
    </div>
    <div class="main">
      <slot name="main" />
    </div>
    <div class="footer">
      <slot name="footer" />
    </div>
  </div>
</template>
<style scoped lang="scss">
//inlude generic definitions
@import 'corteza-webapp-messaging/src/themes/corteza-base/headers.scss';

.rightside-panel-container {
  display: flex;
  flex-flow: column nowrap;
  height: 100vh;
  overflow: hidden;

  & > div.header {
    border-left: 1px solid $light;

    .closer {
      position: absolute;
      top: 5px;
      right: 5px;
      font-size: 25px;
      z-index: 9999;
    }
  }

  & > div.main {
    flex: 1 100%;
    padding-top: 5px;
    overflow-y: auto;
  }
}
</style>
