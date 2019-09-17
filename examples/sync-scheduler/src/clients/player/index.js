import '@babel/polyfill';
import { Client } from '@soundworks/core/client';

import syncServiceFactory from '@soundworks/service-sync/client';
import platformServiceFactory from '@soundworks/service-platform/client';
import PlayerExperience from './PlayerExperience';

// unique audio context for all clients
const audioContext = new AudioContext();
const platformServices = new Set();

async function init($container, index) {
  try {
    const client = new Client();

    client.registerService('platform', platformServiceFactory, {
      features: [
        ['web-audio', audioContext]
      ],
    }, [])

    client.registerService('sync', syncServiceFactory, {
      getTimeFunction: () => audioContext.currentTime,
      report: (index === 1) ? false : true,
    }, ['platform']);

    const platformService = client.serviceManager.get('platform');
    platformServices.add(platformService);

    const config = window.soundworksConfig;
    await client.init(config);

    const errored = (index === 2) ? true : false;
    const playerExperience = new PlayerExperience(client, config, $container, audioContext, errored, index);

    document.body.classList.remove('loading');

    await client.start()
    playerExperience.start();

    // this doesn't work....
    client.socket.addListener('close', () => {
      console.log('CLOSING SOCKET - RELOAD IN 2s');
      setTimeout(() => window.location.reload(true), 2000);
    });
  } catch(err) {
    console.error(err);
  }
}

window.addEventListener('load', async () => {
  const $container = document.querySelector('#container');
  const numClients = 50;

  if (numClients > 1) {
    for (let i = 0; i < numClients; i++) {
      const $div = document.createElement('div');
      $div.classList.add('emulate');
      $container.appendChild($div);

      init($div, i);
    }
  } else {
    init($container, 0);
  }

  // init platform services
  const $initPlatform = document.createElement('div');
  $initPlatform.classList.add('init-platform');
  $initPlatform.textContent = 'resume';

  function initPlatform(e) {
    platformServices.forEach(service => service.onUserGesture(e));
    $initPlatform.remove();
  }

  $initPlatform.addEventListener('touchend', initPlatform);
  $initPlatform.addEventListener('mouseup', initPlatform);

  document.body.appendChild($initPlatform);
});

// QoS
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.location.reload(true);
  }
}, false);
