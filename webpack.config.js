const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const YAML = require('yaml')

// Pick up Electron version [X.Y] from builder configuration:
const { rendererTarget, mainTarget } = (() => {
  const file = fs.readFileSync('./electron-builder.yml', 'utf8')
  const configuration = YAML.parse(file)
  const version = configuration.electronVersion.match(/(\d+\.\d+)/)[0]

  return {
    rendererTarget: 'electron' + version + '-renderer',
    mainTarget: 'electron' + version + '-main'
  }
})()


const RULES = {
  javascript: {
    test: /\.js$/,
    exclude: /node_modules/,
    use: ['babel-loader']
  },

  css: {
    // css-loader: resolve/load required/imported CSS dependencies from JavaScript
    // style-loader: wrap CSS string from css-loader with <style> tag
    // Note: loaders are applied from right to left, i.e. css-loader -> style-loader
    //
    test: /\.(scss|css)$/,
    use: ['style-loader', 'css-loader', 'sass-loader']
  },

  image: {
    test: /\.(png|svg|jpe?g|gif)$/i,
    use: [{
      loader: 'file-loader',
      options: {
        name: 'img/[name].[ext]'
      }
    }]
  },

  font: {
    test: /\.(eot|svg|ttf|woff|woff2)$/,
    type: 'asset/resource'
  }
}

const rules = () => Object.values(RULES)
const mode = env => env.production ? 'production' : 'development'

const rendererConfig = (env, argv) => ({
  context: path.resolve(__dirname, 'src/renderer'),
  target: rendererTarget,

  // In production mode webpack applies internal optimization/minification:
  // no additional plugins necessary.
  // For advanced options: babel-minify-webpack-plugin: https://webpack.js.org/plugins/babel-minify-webpack-plugin
  mode: mode(env),
  stats: 'errors-only',
  module: { rules: rules() },
  entry: {
    renderer: ['./index.js']
  },

  plugins: [
    // Title is managed by BrowserWindow title option.
    new HtmlWebpackPlugin(),
    new webpack.ExternalsPlugin('commonjs', ['leveldown'])
  ]
})

const mainConfig = (env, argv) => ({
  context: path.resolve(__dirname, 'src/main'),
  target: mainTarget,
  mode: mode(env),
  stats: 'errors-only',
  entry: {
    main: './main.js'
  },
  plugins: [
    // NOTE: Required. Else "Error: No native build was found for ..."
    new webpack.ExternalsPlugin('commonjs', ['leveldown'])
  ]
})

const devServer = env => {
  if (env.production) return ({}) // no development server for production
  return ({
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist')
      },
      setupMiddlewares: (middlewares, devServer) => {
        spawn(
          'electron',
          ['.'],
          { shell: true, env: process.env, stdio: 'inherit' }
        )
          .on('close', code => process.exit(code))
          .on('error', error => console.error(error))

        return middlewares
      }
    }
  })
}

const devtool = env => {
  if (env.production) return ({}) // no source maps for production
  return ({
    devtool: 'cheap-source-map'
  })
}

module.exports = (env, argv) => {
  env = env || {}

  // Merge development server and devtool to renderer configuration when necessary:
  const renderer = Object.assign(
    {},
    rendererConfig(env, argv),
    devServer(env),
    devtool(env)
  )

  const main = mainConfig(env, argv)
  return [renderer, main]
}
