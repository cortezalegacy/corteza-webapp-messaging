<template>
  <div class="rightside-panel-container" v-on="$listeners">
    <div class="header">
      <span class="title"><slot name="header"></slot></span>
      <span class="subtitle"><slot name="subtitle"></slot></span>
      <label class="closer"
             @click="$emit('close')"
             :aria-label="$t('pannel.close')"><i class="icon-close"></i></label>
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
@import '@/assets/sass/headers.scss';

.rightside-panel-container {
  display: flex;
  flex-flow: column nowrap;
  height: 100vh;
  overflow: hidden;

  & > div.header {
    border-left: 1px solid $appcream;

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
