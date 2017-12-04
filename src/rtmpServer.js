const RtmpServer = require('rtmp-server');
const chalk = require('chalk');
const rtmpToHLS = require('./rtmpToHLS');
const { streamKey } = require('../config.json');
const { deleteVideos } = require('./utils');

const videoPath = '../public/videos/';

const log = (data, color = 'blue') => {
  console.log(chalk[color](data));
};

function server(socket) {
  const rtmpServer = new RtmpServer();

  rtmpServer.listen(1935);

  rtmpServer.on('error', (err) => {
    throw err;
  });

  rtmpServer.on('client', (client) => {
    client.on('connect', () => log(`CONNECT ${client.app}`, 'blue'));

    client.on('play', () => log('PLAY   ', 'blue'));

    client.on('publish', ({ streamName }) => {
      if (streamKey !== streamName) {
        log('Publishing error: Wrong stream key', 'red');

        return;
      }

      deleteVideos();
      rtmpToHLS(streamName, videoPath);
      socket.broadcast.emit('restart', {});
      socket.broadcast.emit('published', {});

      log('PUBLISH', 'blue');
    });

    client.on('stop', () => {
      deleteVideos();
      socket.broadcast.emit('restart', {});
      socket.broadcast.emit('disconeted', {});
      log('DISCONNECTED', 'red');
    });
  });
}

module.exports = server;
