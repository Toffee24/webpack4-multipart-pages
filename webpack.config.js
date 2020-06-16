const path = require('path')
const fs = require('fs')
const glob = require('glob')
const Webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')

function generateMultiPages() {
  const multipart = {
    entry: {},
    extractCss: [],
    html: []
  }
  multipart.entry = glob
    .sync('./src/pages/**/index.js')
    .reduce((acc, entry) => {
      const name = entry.match(/.+\/(\w+)\/index\.js/)[1]
      multipart.extractCss.push(
        new MiniCssExtractPlugin({
          filename: '[name]/[name].css?v=[contenthash]'
        })
      )
      const isCustomTemplateExist = fs.existsSync(`./src/pages/${name}/index.html`)
      multipart.html.push(
        new HtmlWebpackPlugin({
          filename: `${name}/index.html`,
          template: isCustomTemplateExist ? path.join(__dirname, `/src/pages/${name}/index.html`) : path.join(__dirname, '/src/index.html'),
          inject: true,
          chunks: [name],
          minify: {
            removeComments: true,
            collapseWhitespace: true
          }
        })
      )
      acc[name] = entry
      return acc
    }, {})
  return multipart
}

function assetsPath(_path_) {
  const assetsSubDirectory = '/static'
  return path.posix.join(assetsSubDirectory, _path_)
}

const multiConfig = generateMultiPages()
module.exports = {
  entry: multiConfig.entry,
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name]/index.[hash].js'
  },
  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [path.resolve(__dirname, 'src')],
        options: {
          formatter: require('eslint-friendly-formatter')
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          // 'vue-style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)/,
        use: {
          loader: 'url-loader',
          options: {
            name: assetsPath('images/[name].[hash:7].[ext]'),
            limit: 1024,
            esModule: false
          }
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: assetsPath('fonts/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: assetsPath('media/[name].[hash:7].[ext]')
        }
      }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: false,
    port: 3000,
    overlay: true,
    inline: true,
    hot: true,
    quiet: true
  },
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 500,
    poll: 1000
  },
  devtool: 'cheap-eval-source-map',
  resolve: {
    alias: {
      '@': path.resolve('./src')
    }
  },
  mode: process.env.NODE_ENV,
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'initial',
          name: 'common',
          minChunks: 2,
          maxInitialRequests: 5,
          minSize: 0,
          reuseExistingChunk: true
        }
      }
    }
  },
  plugins: [
    process.env.NODE_ENV === 'production' ? new CleanWebpackPlugin() : new Webpack.HotModuleReplacementPlugin(),
    ...multiConfig.extractCss,
    ...multiConfig.html,
    new VueLoaderPlugin(),
    new Webpack.optimize.SplitChunksPlugin({
      /* chunks: 'all',
      minSize: 30000,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: '-',
      name: true,*/
      cacheGroups: {
        vue: {
          test: /[\\/]node_modules[\\/]vue[\\/]/,
          priority: -10,
          name: 'library'
        }
      }
    }),
    new Webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      }
    }),
    new ProgressBarPlugin({
      format: '  build [:bar] ' + ':percent' + ' (:elapsed seconds)'
    })
  ]
}
