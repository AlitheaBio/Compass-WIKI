const path = require('path');
const { getAliases } = require('./build/aliases');

module.exports = {
  entry: './index.tsx',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      ...getAliases(__dirname),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
    ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'ModuleUI',
      type: 'umd',
      export: 'default',
    },
    globalObject: "typeof self !== 'undefined' ? self : this",
    clean: true,
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    antd: 'antd',
    '@ant-design/icons': 'icons',
    'plotly.js': 'Plotly',
    'plotly.js-dist-min': 'Plotly',
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    devMiddleware: {
      writeToDisk: true,
    },
  },
};
