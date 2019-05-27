<template>
  <div class="auth-container">
    <div class="error" v-if="error">{{ error }}</div>

    <main v-else-if="!processing && configured">
      <img alt="Crust logo" class="logo" src="../assets/images/crust-logo-with-tagline.png">
      <section>
        <h1>{{ t(`dialog.${$route.name}.title`) }}</h1>
        <router-view
          :afterLogin="updatePlugins"
          :afterSignup="updatePlugins"
          :afterConfirmEmail="afterConfirmEmail"
          :afterLogout="afterLogout"
          :onExternalAuth="onExternalAuth"
          v-bind="settings"/>

      </section>
    </main>
  </div>
</template>

<script>
import updatePlugins from '../plugins/update'
import updateState from '../store/update'

export default {
  name: 'Auth',

  data () {
    return {
      logo: require('@/assets/images/crust-logo-with-tagline.png'),

      configured: false,
      processing: false,
      error: null,

      settings: {
        internalEnabled: null,
        internalPasswordResetEnabled: null,
        internalSignUpEmailConfirmationRequired: null,
        internalSignUpEnabled: null,

        externalEnabled: null,
        externalProviders: [],
      },
    }
  },

  computed: {
    route () {
      return this.$route.name
    },

    t () {
      return (k) => ({
        'dialog.change-password.title': 'Change your password',
        'dialog.confirm-email.title': 'Email confirmation',
        'dialog.login.title': 'Login',
        'dialog.logout.title': 'Logout',
        'dialog.request-password-reset.title': 'Request password reset link',
        'dialog.reset-password.title': 'Reset your password',
        'dialog.sign-up.title': 'Sign up',
        'dialog.profile.title': 'Your Crust profile',
      }[k] || k)
    },
  },

  watch: {
    route: {
      handler: function (newVal, oldVal) {
        console.debug({ newVal })
        this.attemptConfig()
      },
    },
  },

  created () {
    if (!process.env.VUE_APP_CORDOVA) {
      this.configured = true
      this.loadSettings()
      return
    }

    navigator.splashscreen.hide()
    this.attemptConfig()
  },

  methods: {
    onExternalAuth (url) {
      if (!url) return

      if (!process.env.VUE_APP_CORDOVA) {
        window.location = url
        return
      }

      /* eslint-disable no-undef */
      const iab = cordova.InAppBrowser.open(url, '_blank', 'location=no,beforeload=yes,hidenavigationbuttons=yes,zoom=no')

      // If url has our token, take it and use it for exchange
      const r = /^.+[?&]token=([a-zA-Z0-9]{32}\d+).*$/
      iab.addEventListener('loadstart', ({ url }) => {
        const rr = r.exec(url)
        console.debug(url, rr)
        if (rr != null) {
          iab.close()
          this.$router.push({ name: 'login', query: { token: rr[1] } })
        }
      })
    },

    // Checks & configures client if needed
    attemptConfig () {
      this.configured = false
      let cd = localStorage.getItem('crust.domain')
      console.debug({ cd })
      if (!cd || cd === 'null') {
        window.crustHybrid.configureClient()
          .then(({ config, domain }) => {
            // Update config
            Object.assign(window, config)
            delete window.invalid

            this.$system.baseURL = window.CrustSystemAPI
            this.configured = true
            this.loadSettings()
          })
      } else {
        // No config needed
        this.configured = true
        this.loadSettings()
      }
    },

    afterLogout () {
      localStorage.removeItem('crust.domain')
      this.$router.push({ name: 'login' })
    },

    updatePlugins () {
      updatePlugins(this, null)
      updateState(this, null)
      this.$router.push({ name: 'landing' })
    },

    afterConfirmEmail () {
      window.setTimeout(() => {
        this.updatePlugins()
      }, 3000)
    },

    loadSettings () {
      this.error = null
      this.processing = true

      this.$system.authSettings().then(ss => {
        for (var k in this.settings) {
          if (ss[k] !== undefined) {
            this.settings[k] = ss[k]
          }
        }

        // For now, sort by label just to have a stable order
        // we'll support custom sort order of external providers later.
        if (Array.isArray(this.settings.externalProviders)) {
          this.settings.externalProviders = this.settings.externalProviders.sort((a, b) => {
            return a.label.localeCompare(b.label)
          })
        }
      }).catch(({ message } = {}) => {
        if (message !== 'Network Error') {
          this.$auth.JWT = null
          this.$auth.user = null
        }

        this.error = message
      }).finally(() => {
        this.processing = false
      })
    },
  },
}
</script>
<style lang="scss" scoped>
.error {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #E85568;
  font-size: 24px;
  background-color: #FFFFFF;
  height: 20vh;
  top: 40vh;
  text-align: center;
}

main {
  h1 {
    margin: 0;
    padding: 0 0 20px 0;
    font-size: 18px;
  }

  position: relative;
  max-width: 320px;

  section {
    margin-top: 20px;
    padding: 20px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  }

  img.logo {
    max-width: 80%;
    display: block;
    margin: 0 auto;
  }
}

</style>

<style lang="scss">
.auth-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  padding: 40px 0;

  .error {
    margin-top: 5px;
    color: #E85568;
  }

  h2 {
    font-size: 15px;
  }

  input {
    border-radius: 3px;
    width: calc(100% - 10px);
    height: 40px;
    padding-left: 10px;
    border: 1px solid #90A3B1;
    color: black;
    font-size: 14px;

    &:focus,
    &:active {
      outline: none;
      border-color: #1397CB;
    }

    &:disabled {
      background: #90A3B1;
    }

    &.error {
      color: black;
      border-color: #E85568;
    }
  }

  label {
    display: block;
    margin: 20px 0 5px 0;
    font-size: 13px;
  }

  button {
    &.login-btn {
      display: block;
      margin: 10px auto;
      outline-color: transparent;
      border: none;
      border-radius: 40px;
      padding: 10px 40px;
      color: #ffffff;
      font-size: 16px;
      cursor: pointer;
      background: #FFCC32;

      &:hover {
        opacity: 0.9;
      }
    }
  }

  .or {
    margin: 15px 0;
    text-align: center;
    width: 100%;
    opacity: 0.5;

    &::before,
    &::after {
      content: "\00a0";
      border-bottom: solid 1px grey;
      min-width: 30px;
      display: inline-block;
      vertical-align: middle;
      margin: -0.5em 1em 0 1em;
      height: 0.5em;
      overflow: hidden;
    }
  }

  .external-providers {
    border: none;
  }

  .footnote {
    border-top: 1px solid #90A3B1;
    margin-top: 20px;
    padding-top: 10px;
    font-size: 14px;

    a {
      color: #000;
    }
  }
}
</style>
