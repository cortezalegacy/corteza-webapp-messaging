const buildVueConfig = require('./vue.config-builder')

module.exports = buildVueConfig({
  appFlavour: 'Corteza',
  appName: 'messaging',
  appLabel: 'Corteza Messaging',
  theme: 'corteza-base',
  packageAlias: 'corteza-webapp-messaging',
})
