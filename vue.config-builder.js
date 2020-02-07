const webpack = require('webpack')
const exec = require('child_process').execSync
const path = require('path')

module.exports = ({ appFlavour, appName, appLabel, version, theme, packageAlias, root = path.resolve('.'), env = process.env.NODE_ENV }) => {
  const isDevelopment = (env === 'development')
  const isProduction = (env === 'production')
  const isTest = (env === 'test')

  if (isTest) {
    const Vue = require('vue')
    Vue.config.devtools = false
    Vue.config.productionTip = false
  }

  const publicPath = isProduction ? '/' + appName : '/'
  const optimization = isTest ? {} : {
    usedExports: true,
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  }

  return {
    publicPath,

    // Vue ESLint does not understand that it should NOT dive into node_modules!
    //
    // This presents a problem because it loads @cortezaproject/corteza-*/.eslintrc.js files
    // that contain @typescript-eslint plugins + the entire typescript toolset that we do not
    // want or need here.
    //
    // Keep this value on false and run `yarn lint` to inspect and fix lint issues.
    lintOnSave: false,

    runtimeCompiler: true,

    configureWebpack: {
      // other webpack options to merge in ...
      plugins: [
        new webpack.DefinePlugin({
          FLAVOUR: JSON.stringify(appFlavour),
          WEBAPP: JSON.stringify(appLabel),
          VERSION: JSON.stringify(version || ('' + exec('git describe --always --tags')).trim()),
          BUILD_TIME: JSON.stringify((new Date()).toISOString()),
        }),
      ],

      optimization,
    },

    chainWebpack: config => {
      // Do not copy config files (deployment procedure will do that)
      config.plugin('copy').tap(options => {
        options[0][0].ignore.push('config*js')
        return options
      })

      // Aliasing full package name instead of '@' so we do
      // not break imports on apps that import this code
      config.resolve.alias.delete('@')
      if (packageAlias) {
        config.resolve.alias.set(packageAlias, root)
      }

      const scssNormal = config.module.rule('scss').oneOf('normal')

      scssNormal.use('sass-loader')
        .loader('sass-loader')
        .tap(options => ({
          ...options,
          sourceMap: true,
          sourceMapContents: false,
        }))

      // Load CSS assets according to their location
      scssNormal.use('resolve-url-loader')
        .loader('resolve-url-loader').options({
          keepQuery: true,
          root: path.join(root, 'src/themes', theme),
        })
        .before('sass-loader')
    },

    devServer: {
      host: '127.0.0.1',
      hot: true,
      disableHostCheck: true,

      overlay: {
        warnings: true,
        errors: true,
      },

      watchOptions: {
        ignored: [
          // Do not watch for changes under node_modules
          // (exception is node_modules/@cortezaproject)
          /node_modules([\\]+|\/)+(?!@cortezaproject)/,
        ],
        aggregateTimeout: 200,
        poll: 1000,
      },
    },

    css: {
      sourceMap: isDevelopment,
      loaderOptions: {
        sass: {
          // @todo cleanup all components and remove this global import
          data: `
            @import "./src/themes/${theme}/variables.scss";
          `,
        },
      },
    },
  }
}
