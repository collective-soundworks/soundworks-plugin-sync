# `@soundworks/plugin-sync`

> [`soundworks`](https://github.com/collective-soundworks/soundworks) plugin for synchronizing arbitrary clocks across devices. The plugin is basically a wrapper around the [`@ircam/sync`](https://github.com/collective-soundworks/sync) library.

## Table of Contents

<!-- toc -->

- [Installation](#installation)
- [Example](#example)
- [Usage](#usage)
  * [Server installation](#server-installation)
    + [Registering the plugin](#registering-the-plugin)
    + [Requiring the plugin](#requiring-the-plugin)
  * [Client installation](#client-installation)
    + [Registering the plugin](#registering-the-plugin-1)
    + [Requiring the plugin](#requiring-the-plugin-1)
  * [Additional Documentation](#additional-documentation)
- [Resources](#resources)
- [Credits](#credits)
- [License](#license)

<!-- tocstop -->

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
  // choose the clock to use as the reference, defaults to
  // where `startTime` is the time at which the plugin is instantiated:
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
  // choose the clock to synchronize, defaults to
  // where `startTime` is the time at which the plugin is instantiated:
  // () => Date.getTime() / 1000
  getTimeFunction: () => (new Date().getTime() * 0.001) - startTime,
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

### Additional Documentation

## Resources

- [Jean-Philippe Lambert, Sébastien Robaszkiewicz, Norbert Schnell. Synchronisation for Distributed Audio Rendering over Heterogeneous Devices, in HTML5. 2nd Web Audio Conference, Apr 2016, Atlanta, GA, United States.](https://hal.archives-ouvertes.fr/hal-01304889v1)

## Credits

The code has been initiated in the framework of the WAVE and CoSiMa research projects, funded by the French National Research Agency (ANR).

## License

BSD-3-Clause
