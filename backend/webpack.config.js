export default {
  target: 'webworker',
  entry: './src/worker.js',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    ],
  },
  output: {
    filename: 'worker.js',
    path: './dist',
  },
};
