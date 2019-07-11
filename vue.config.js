const buildVueConfig = require('./vue.config-builder')

module.exports = buildVueConfig({
  appName: 'messaging',
  appLabel: 'Corteza Messaging',
  theme: 'corteza-base',
  packageAlias: 'corteza-webapp-messaging',
})
