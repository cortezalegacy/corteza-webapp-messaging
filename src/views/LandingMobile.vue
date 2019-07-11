<template>
  <div class="mobile">
    <div class="logo-container">
      <img class="logo" src="../themes/corteza-base/images/corteza-logo-with-tagline.png" alt="Logo with tagline"/>
    </div>
    <div class="badges">
      <div>
        <a href="https://play.google.com/store/apps/details?id=tech.crust.hybrid.messaging">
          <img class="badge" src="../themes/corteza-base/badges/google-play.svg" alt="Google play"/>
        </a>
      </div>

      <div>
        <img class="mobile-preview" src="../themes/corteza-base/images/mobile-preview.png" alt="Mobile preview"/>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
@import 'corteza-webapp-messaging/src/themes/corteza-base/btns.scss';

div {
  display: flex;
  flex-direction: row;
  justify-content: center;
}

.mobile {
  display: block;
  height: 100%;
  width: 100%;
  background: #efefef;
  overflow-y: auto;
}

.logo {
  width: auto;
  height: 30vw;
  max-height: 30vw;
  opacity: 0.8;
}

img {
  margin: 10px;
  max-width: 100%;
}

.mobile-preview {
  min-width: 250px;
  width: 65vw;
  height: 100%;
}

.badge {
  width: auto;
  height: 10vw;
}

.badges {
  margin-top: 5vw;
  flex-direction: column;
  align-content: space-around;
}

@media (orientation: landscape) {
  .logo {
    height: 30vh;
  }

  .mobile-preview {
    width: 65vh;
    height: 100%;
  }

  .badge {
    height: 10vh;
  }

  .badges {
    margin-top: 5vh;
  }
}
</style>
