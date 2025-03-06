process.env.CHINER_NODE_ENV = 'development';
const path = require('path');
const childProcess = require('child_process');
const webpack = require('webpack');
const config = require('../config/webpack.dev.config.js');
const profile = require('../profile');

const host = profile.host;
const port = profile.port;
const protocol = profile.protocol;
const WebpackDevServer = require('webpack-dev-server');

config.entry.app.unshift(`webpack-dev-server/client?${protocol}://${host}:${port}/`);

const compiler = webpack(config);

const devServer = new WebpackDevServer(compiler, {
    stats: { colors: true },
    contentBase: path.resolve(__dirname, '../public'),
});

devServer.listen(port, host, () => {
    // 启动electron
    childProcess.spawn('npm', ['run', 'electron'], { shell: true, env: process.env, stdio: 'inherit' })
      .on('close', code => process.exit(code))
      .on('error', spawnError => console.error(spawnError));
});
