import '@babel/polyfill';
import { Client } from '@soundworks/core/client';
// import delayServiceFactory from '@soundworks/service-delay/client';
import syncServiceFactory from '@soundworks/service-sync/client';
import PlayerExperience from './PlayerExperience';

async function init($container, index) {
  try {
    const client = new Client();

    const randomOffset = (Math.random() - 0.5) * 1e3;
    const report = (index === 1) ? false : true;

    client.registerService('sync', syncServiceFactory, {
      // the time return by `getTimeFunction` must be in seconds
      getTimeFunction: () => { return performance.now() * 0.001 + randomOffset },
      report: report,
    })

    const config = window.soundworksConfig;
    await client.init(config);

    const errored = (index === 2) ? true : false;
    const playerExperience = new PlayerExperience(client, config, $container, errored);

    document.body.classList.remove('loading');

    await client.start()
    playerExperience.start();

    // this doesn't work....
    client.socket.addListener('close', () => {
      console.log('CLOSING SOCKET - RELOAD IN 2s');
      setTimeout(() => window.location.reload(true), 2000);
    });

    // client.socket.addListener('error', () => {
    //   console.log('SOCKET ERROR - RELOAD IN 2s');
    //   setTimeout(() => window.location.reload(true), 2000);
    // });
  } catch(err) {
    console.error(err);
  }
}

window.addEventListener('load', () => {
  const $container = document.querySelector('#container');
  const numClients = 5;

  if (numClients > 1) {
    for (let i = 0; i < numClients; i++) {
      const $div = document.createElement('div');
      $div.style.float = 'left';
      $div.style.width = '300px';
      $div.style.height = '500px';
      $div.style.outline = '1px solid #aaaaaa';
      $container.appendChild($div);

      init($div, i);
    }
  } else {
    init($container, 0);
  }
});

// QoS
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.location.reload(true);
  }
}, false);
