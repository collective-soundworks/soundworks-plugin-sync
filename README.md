# soundworks-service-template

> Sync service for the soundworks framework.
>
> Basically a wrapper of [https://github.com/collective-soundworks/sync](https://github.com/collective-soundworks/sync)

## Install

```sh
npm install --save @soundworks/service-sync
```

## Configuration

### Client

#### registering the service

```js
// index.js
import { Client } from '@soundworks/core/client';
import serviceSyncFactory from '@soundworks/service-sync/client';

const client = new Client();
client.registerService('sync', serviceSyncFactory, {
  getTimeFunction: () => new Date().getTime(),
}, dependencies = []);
```

##### usage in conjonction with `@soundworks/service-platform`

If you use an `AudioContext` to synchronize audio events accross device, the  `AudioContext` should be resumed before the synchronization process starts. This can be achieved using the `@soundworks/service-platform`.

```js
// index.js
import { Client } from '@soundworks/core/client';
import servicePlatformFactory from '@soundworks/service-platform/client';
import serviceSyncFactory from '@soundworks/service-sync/client';

const client = new Client();
const audioContext = new AudioContext();

client.registerService('platform', serviceSyncFactory, {
  features: [
    ['web-audio', audioContext]
  ]
}, []);

client.registerService('sync', serviceSyncFactory, {
  getTimeFunction: () => audioContext.currentTime,
}, ['platform']); // add 'platform' as a dependency of the sync service
```

#### requiring the service 

```js
// MyExperience.js
import { Experience } from '@soundworks/core/client';

class MyExperience extends Experience {
  constructor() {
    super();

    this.sync = this.require('sync');
  }

  start() {
    const syncTime = this.sync.getSyncTime();
    const localTime = this.sync.getLocalTime();
  }
}
```

#### options

- `getTimeFunction`: function that return a clock to be synchronized with the server (defaults to `() => new Date().getTime()`)
- `report`: define if the client should report the synchronization reports to the server (defaults to  `false`)

### Server

#### registering the service

```js
// index.js
import { Server } from '@soundworks/core/server';
import serviceSyncFactory from '@soundworks/service-sync/server';

const server = new Server();
server.registerService('sync', serviceSyncFactory, {}, dependencies = []);
```

#### requiring the service 

```js
// MyExperience.js
import { Experience } from '@soundworks/core/server';

class MyExperience extends Experience {
  constructor() {
    super();

    this.sync = this.require('sync');
  }

  start() {
    const syncTime = this.sync.getSyncTime();
  }

  connect(client) {}
  disconnect(client) {}
}
```

#### options

- `getTimeFunction`: function that return a time to be used as the common time (sync time) accross clients and server (default to `process.hrtime`)

## Readings

cf. [Synchronisation for Distributed Audio Rendering over Heterogeneous Devices, in HTML5](https://smartech.gatech.edu/handle/1853/54598) for more informations

## License

BSD-3-Clause
