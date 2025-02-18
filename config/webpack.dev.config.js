var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var ScriptExtHtmlPlugin = require('script-ext-html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  entry: {
    app: [require.resolve('@babel/polyfill'),
      path.resolve(__dirname, '../src/lib/Math'),
      path.resolve(__dirname, '../src/index')]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        common: {
          name: "common",
          chunks: "all",
          minSize: 1,
          priority: 0
        },
        vendor: {
          name: "vendor",
          test: /[\\/]node_modules[\\/]/,
          chunks: "all",
          priority: 10
        }
      }
    }
  },
  output: {
    path: path.resolve(__dirname, '../build'),
    filename: "[name].js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      inject: true,
      template: path.resolve(__dirname, '../public/index.html'),
      filename: 'index.html',
      chunks: ['vendor', 'common', 'app']
    }),
    new ScriptExtHtmlPlugin({
      defaultAttribute: 'defer'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].style.css',
    })
  ],
  resolveLoader:{
    modules: ['node_modules','config']
  },
  resolve: {
    mainFields: ['browser', 'main'],
    alias: {
      'components': path.resolve(__dirname, '../src/components'),
      'style': path.resolve(__dirname, '../src/style/index.less')
    }
  },
  module: {
    rules: [
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },
      {
        test: /worker\.js$/,
        exclude: /node_modules/,
        use: [
          {
        test: /\.(ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },
      { loader: 'worker-loader' }
        ]
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },
      {
        test: /\.(js|tsx|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },
      {
        test: /\.(js|tsx|jsx)$/,
        exclude: /node_modules/,
        loader: "eslint-loader"
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },
      {
        test: /\.(css|less)$/,
        loader: [
          {
        test: /\.(ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },
      {
            loader: MiniCssExtractPlugin.loader,
          },
          "css-loader",
          {
        test: /\.(ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },
      { loader: "postcss-loader", options: { plugins: () => [ require('autoprefixer')() ]}},
          {
        test: /\.(ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },
      { loader: 'less-loader', options: {javascriptEnabled: true, modifyVars: {'@semi-theme': 'default'}}}
        ]
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },
      {
        test: /\.(png|jpg|svg|gif)$/,
        loader: 'url-loader',
        options: {
          limit: 8192
        }
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      },
      {
        test: require.resolve('../src/lib/middle'),
        loader: "MiddleLoader?platform=json"
      },
    ]
  },
  target: 'electron-renderer'
}
