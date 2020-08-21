# `@soundworks/plugin-sync`

> [`soundworks`](https://github.com/collective-soundworks/soundworks) plugin for synchronizing arbitrary clocks across devices. The plugin is basically a wrapper around the [`@ircam/sync`](https://github.com/collective-soundworks/sync) library.

## Table of Contents

<!-- toc -->

- [Why](#why)
- [Installation](#installation)
- [Example](#example)
- [Usage](#usage)
  * [Server installation](#server-installation)
    + [Registering the plugin](#registering-the-plugin)
    + [Requiring the plugin](#requiring-the-plugin)
  * [Client installation](#client-installation)
    + [Registering the plugin](#registering-the-plugin-1)
    + [Requiring the plugin](#requiring-the-plugin-1)
  * [Local time and synchronized time](#local-time-and-synchronized-time)
  * [Auditing synchronization process](#auditing-synchronization-process)
- [Resources](#resources)
- [Credits](#credits)
- [License](#license)

<!-- tocstop -->

## Why

Because "as a consequence of dealing with independent nodes, each one will have its own notion of time. In other words, we cannot assume that there is something like a **global clock**" in _Maarten van Steen and Andrew S. Tanenbaum, A brief introduction to distributed systems, Computing, vol.98, n°10, 2016_

## Installation

```sh
npm install @soundworks/plugin-sync --save
```

## Example

A working example can be found in the [https://github.com/collective-soundworks/soundworks-examples](https://github.com/collective-soundworks/soundworks-examples) repository.

## Usage

### Server installation

#### Registering the plugin

```js
// index.js
import { Server } from '@soundworks/core/server';
import pluginSyncFactory from '@soundworks/plugin-sync/server';

const server = new Server();
server.pluginManager.register('sync', pluginSyncFactory, {
  // choose the clock to use as the reference, defaults to:
  // (where `startTime` is the time at which the plugin is instantiated)
  getTimeFunction: () => {
    const now = process.hrtime(startTime);
    return now[0] + now[1] * 1e-9;
  },
}, []);
```

#### Requiring the plugin

```js
// MyExperience.js
import { AbstractExperience } from '@soundworks/core/server';

class MyExperience extends AbstractExperience {
  constructor(server, clientType) {
    super(server, clientType);
    // require plugin in the experience
    this.sync = this.require('sync');
  }
}
```

### Client installation

#### Registering the plugin

```js
// index.js
import { Client } from '@soundworks/core/client';
import pluginSyncFactory from '@soundworks/plugin-sync/client';

const client = new Client();
client.pluginManager.register('sync', pluginSyncFactory, {
  // choose the clock to synchronize, defaults to:
  // (where `startTime` is the time at which the plugin is instantiated)
  getTimeFunction: () => Date.now() * 0.001 - startTime,
}, []);
```

#### Requiring the plugin

```js
// MyExperience.js
import { Experience } from '@soundworks/core/client';

class MyExperience extends Experience {
  constructor(client) {
    super(client);
    // require plugin in the experience
    this.sync = this.require('sync');
  }
}
```

### Local time and synchronized time

The following API is similar client-side and server-side

```js
// get current time from the local clock reference
const localTime = this.sync.getLocalTime();
// get time in the local clock reference according to the
// time given in the synchronized clock reference
const localTime = this.sync.getLocalTime(syncTime);

// get time estimated in the synchronized clock reference
const sync = this.sync.getSyncTime();
// get time estimated in the synchronized clock reference
// according the time given in the local clock reference
const sync = this.sync.getSyncTime(localTime);
```

### Auditing synchronization process

On the client side you can track the synchronization process, by checking the synchronization reports

```js
// be notified when a new report is available
this.sync.onReport(report => {
  console.log(report);
});

// or in a pull fashion
const report = this.sync.getReport();
```

## Resources

- [Jean-Philippe Lambert, Sébastien Robaszkiewicz, Norbert Schnell. Synchronisation for Distributed Audio Rendering over Heterogeneous Devices, in HTML5. 2nd Web Audio Conference, Apr 2016, Atlanta, GA, United States.](https://hal.archives-ouvertes.fr/hal-01304889v1)

## Credits

The code has been initiated in the framework of the WAVE and CoSiMa research projects, funded by the French National Research Agency (ANR).

## License

BSD-3-Clause
