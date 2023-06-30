# soundworks | plugin sync

[![npm version](https://badge.fury.io/js/@soundworks%2Fplugin-sync.svg)](https://badge.fury.io/js/@soundworks%2Fplugin-sync)

[`soundworks`](https://github.com/collective-soundworks/soundworks) plugin for synchronizing clients on a common master clock.

Because "as a consequence of dealing with independent nodes, each one will have its own notion of time. In other words, we cannot assume that there is something like a **global clock**" [[M. van Steen & A. S. Tanenbaum](https://link.springer.com/article/10.1007/s00607-016-0508-7)]. The `sync` plugin synchronizes a local clock from the client with a master clock from the server.

The plugin is a wrapper around the [`@ircam/sync`](https://github.com/ircam-ismm/sync) library.

## Table of Contents

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
  * [Server](#server)
  * [Client](#client)
- [Notes](#notes)
  * [Using `audioContext.currentTime` as the local clock](#using-audiocontextcurrenttime-as-the-local-clock)
  * [Correspondance between local time and sync time](#correspondance-between-local-time-and-sync-time)
  * [Scheduling synchroinzed audio events](#scheduling-synchroinzed-audio-events)
- [API](#api)
  * [Classes](#classes)
  * [PluginSyncClient](#pluginsyncclient)
  * [PluginSyncServer](#pluginsyncserver)
- [Resources](#resources)
- [Credits](#credits)
- [License](#license)

<!-- tocstop -->

## Installation

```sh
npm install --save @soundworks/plugin-sync
```

## Usage

### Server

```js
// index.js
import { Server } from '@soundworks/core/server.js';
import pluginSync from '@soundworks/plugin-sync/server.js';

const server = new Server(config);
server.pluginManager.register('sync', pluginSync);
```

By default the server-side master clock return the time in seconds since the plugin started using `process.hrtime()`, i.e:

```js
let startTime = process.hrtime();

getTimeFunction() {
  const now = process.hrtime(startTime);
  return now[0] + now[1] * 1e-9;
}
```

In most case, you will be perfectly fine with this default.

### Client

```js
// index.js
import { Client } from '@soundworks/core/client.js';
import pluginSync from '@soundworks/plugin-sync/client.js';

const client = new Client();
client.pluginManager.register('sync', pluginSync);
```

By default the client-side is which the synchronzation is done return the time in second since the plugin started using `performance.now` (if available) or `Date.now` on browser clients, and `process.hrtime` on node clients. All of these clocks use an origin set when the plugin starts.

In many case, you will want to configure this function to synchronize to a particular clock, such as the `audioContext.currentTime` to synchronize audio events between different clients:

## Notes

### Using `audioContext.currentTime` as the local clock

An important thing to consider to synchronize using `audioContext.currentTime` is that the audio clock starts to increment only after `await audioContext.resume()` has been called. If the `audioContext` is suspended calling `audioContext.currentTime` will always return `0`, breaking the synchronization process. Therefore you must make sure to `resume` the audio context first using the [`@soudnworks/plugin-platform-init`](https://soundworks.dev/plugins/platform-init.html) plugin before starting the `sync` plugin itself.

First you will need to install the `@soundworks/plugin-platform-init`

```sh
npm install --save @soundworks/plugin-platform-init
```

Then, you will need to register the `platform-init` plugin and configure it so that it resumes the audio context, and finally configure the `sync` plugin to use the `audioContext.currentTime` as the local clock:

```js
import { Client } from '@soundworks/core/client.js';
import pluginPlatform from '@soundworks/plugin-platform-init/client.js';
import pluginSync from '@soundworks/plugin-sync/client.js';

const client = new Client(config);
// create an audio context
const audioContext = new AudioContext();
// register the platform plugin to resume the audio context
client.pluginManager.register('platform', pluginPlatform, { audioContext });
// configure the platform plugin to use a resumed audio context
client.pluginManager.register('sync', pluginSync, {
  getTimeFunction: () => audioContext.currentTime,
}, ['platform']);
```

Note the 4rth argument passed to the `pluginManager` when registering the `sync` plugin (i.e. `['platform']`). This argument specifically tells soundworks to start the `sync` plugin only once the `platform` plugin is itself started.

### Correspondance between local time and sync time

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

### Scheduling synchroinzed audio events

When you propagate some event on your network of devices to trigger a sound at a specific synchronized time, you will need to convert this synchronized information to the local audio clock so that you speak to the audio context on it's own clock (which wont be same on each device). The next example assume you have some [shared state](https://soundworks.dev/tutorials/state-manager.html) 

```js
// client pseudo-code
const sync = await client.pluginManager.get('sync');

sharedState.onUpdate(updates => {
  // syncTriggerTime is the time of an audio even defined in the sync clock
  if ('syncTriggerTime' in updates) {
    const syncTime = updates.syncTriggerTime;
    // convert to local audio time
    const audioTime = sync.getLocalTime(syncTime);
    // trigger your sound in the local audio time reference
    const src = audioContext.createBufferSource;
    src.buffer = someAudioBuffer;
    src.connect(audioContext.destination);
    src.start(audioTime); 
  }
})
```

Note that this strategy effectively trigger the sound at the same time on each client, but it will not compensate for the [audio output latency](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency) of each client (which unfortunately may differ to a great extent...).

## API

<!-- api -->

### Classes

<dl>
<dt><a href="#PluginSyncClient">PluginSyncClient</a></dt>
<dd><p>Client-side representation of the soundworks&#39; sync plugin.</p>
</dd>
<dt><a href="#PluginSyncServer">PluginSyncServer</a></dt>
<dd><p>Server-side representation of the soundworks&#39; sync plugin.</p>
</dd>
</dl>

<a name="PluginSyncClient"></a>

### PluginSyncClient
Client-side representation of the soundworks' sync plugin.

**Kind**: global class  

* [PluginSyncClient](#PluginSyncClient)
    * [new PluginSyncClient()](#new_PluginSyncClient_new)
    * [.getLocalTime([syncTime])](#PluginSyncClient+getLocalTime) ⇒ <code>Number</code>
    * [.getSyncTime([audioTime])](#PluginSyncClient+getSyncTime) ⇒ <code>Number</code>
    * [.onReport(callback)](#PluginSyncClient+onReport)
    * [.getReport()](#PluginSyncClient+getReport) ⇒ <code>Object</code>

<a name="new_PluginSyncClient_new"></a>

#### new PluginSyncClient()
The constructor should never be called manually. The plugin will be
instantiated by soundworks when registered in the `pluginManager`

Available options:
- `getTimeFunction` {Function} - Function that returns a time in second.
 Defaults to `performance.now` is available or `Date.now` on browser clients,
 and `process.hrtime` on node clients, all of them with an origin set when
 the plugin starts.
- `[onReport=null]` {Function} - Function to execute when the synchronization
 reports some statistics.

**Example**  
```js
client.pluginManager.register('sync', syncPlugin, {
  getTimeFunction: () => audioContext.currentTime,
});
```
<a name="PluginSyncClient+getLocalTime"></a>

#### pluginSyncClient.getLocalTime([syncTime]) ⇒ <code>Number</code>
Time of the local clock. If no arguments provided, returns the current
local time, else performs the convertion between the given sync time
and the associated local time.

**Kind**: instance method of [<code>PluginSyncClient</code>](#PluginSyncClient)  
**Returns**: <code>Number</code> - Local time corresponding to the given sync time (sec).  

| Param | Type | Description |
| --- | --- | --- |
| [syncTime] | <code>Number</code> | optionnal, time from the sync clock (sec). |

<a name="PluginSyncClient+getSyncTime"></a>

#### pluginSyncClient.getSyncTime([audioTime]) ⇒ <code>Number</code>
Time of the synced clock. If no arguments provided, returns the current
sync time, else performs the convertion between the given local time
and the associated sync time.

**Kind**: instance method of [<code>PluginSyncClient</code>](#PluginSyncClient)  
**Returns**: <code>Number</code> - Sync time corresponding to the given local time (sec).  

| Param | Type | Description |
| --- | --- | --- |
| [audioTime] | <code>Number</code> | optionnal, time from the local clock (sec). |

<a name="PluginSyncClient+onReport"></a>

#### pluginSyncClient.onReport(callback)
Subscribe to reports from the sync process.
See [https://github.com/ircam-ismm/sync#SyncClient..reportFunction](https://github.com/ircam-ismm/sync#SyncClient..reportFunction)

**Kind**: instance method of [<code>PluginSyncClient</code>](#PluginSyncClient)  

| Param | Type |
| --- | --- |
| callback | <code>function</code> | 

<a name="PluginSyncClient+getReport"></a>

#### pluginSyncClient.getReport() ⇒ <code>Object</code>
Get last statistics from the synchronaization process.
See [https://github.com/ircam-ismm/sync#SyncClient..reportFunction](https://github.com/ircam-ismm/sync#SyncClient..reportFunction)

**Kind**: instance method of [<code>PluginSyncClient</code>](#PluginSyncClient)  
**Returns**: <code>Object</code> - The last report  
<a name="PluginSyncServer"></a>

### PluginSyncServer
Server-side representation of the soundworks' sync plugin.

**Kind**: global class  

* [PluginSyncServer](#PluginSyncServer)
    * [new PluginSyncServer()](#new_PluginSyncServer_new)
    * [.getLocalTime([syncTime])](#PluginSyncServer+getLocalTime) ⇒ <code>Number</code>
    * [.getSyncTime([localTime])](#PluginSyncServer+getSyncTime) ⇒ <code>Number</code>

<a name="new_PluginSyncServer_new"></a>

#### new PluginSyncServer()
The constructor should never be called manually. The plugin will be
instantiated by soundworks when registered in the `pluginManager`

Available options:
- `getTimeFunction` {Function} - Function that returns a time in second.
 Defaults to `process.hrtime` with an origin set when the plugin starts.
 In most cases, you shouldn't have to modify this default behavior.

**Example**  
```js
server.pluginManager.register('sync', syncPlugin);
```
<a name="PluginSyncServer+getLocalTime"></a>

#### pluginSyncServer.getLocalTime([syncTime]) ⇒ <code>Number</code>
Time of the local clock. If no arguments provided, returns the current
local time, else performs the convertion between the given sync time
and the associated local time.

**Kind**: instance method of [<code>PluginSyncServer</code>](#PluginSyncServer)  
**Returns**: <code>Number</code> - Local time corresponding to the given sync time (sec).  
**Note:**: server-side, `getLocalTime` and `getSyncTime` are identical  

| Param | Type | Description |
| --- | --- | --- |
| [syncTime] | <code>Number</code> | optionnal, time from the sync clock (sec). |

<a name="PluginSyncServer+getSyncTime"></a>

#### pluginSyncServer.getSyncTime([localTime]) ⇒ <code>Number</code>
Time of the synced clock. If no arguments provided, returns the current
sync time, else performs the convertion between the given local time
and the associated sync time.

**Kind**: instance method of [<code>PluginSyncServer</code>](#PluginSyncServer)  
**Returns**: <code>Number</code> - Sync time corresponding to the given local time (sec).  
**Note:**: server-side, `getLocalTime` and `getSyncTime` are identical  

| Param | Type | Description |
| --- | --- | --- |
| [localTime] | <code>Number</code> | optionnal, time from the local clock (sec). |


<!-- apistop -->

## Resources

- Jean-Philippe Lambert, Sébastien Robaszkiewicz, Norbert Schnell. Synchronisation for Distributed Audio Rendering over Heterogeneous Devices, in HTML5. 2nd Web Audio Conference, Apr 2016, Atlanta, GA, United States. <[hal-01304889v1](https://hal.archives-ouvertes.fr/hal-01304889v1)>

## Credits

[https://soundworks.dev/credits.html](https://soundworks.dev/credits.html)

## License

[BSD-3-Clause](./LICENSE)
