import { SyncServer } from '@ircam/sync';
import { isFunction, getTime } from '@ircam/sc-utils';
import { ServerPlugin } from '@soundworks/core/server.js';

// @note
// The standard TCP packet size has a minimum of 20 bytes and a maximum of 60 bytes

/**
 * Server-side representation of the soundworks sync plugin.
 *
 * The constructor should never be called manually. The plugin will be
 * instantiated by soundworks when registered in the `pluginManager`
 *
 * Available options:
 * - `getTimeFunction` {Function} - Function that returns a time in second.
 *  Defaults to `process.hrtime` with an origin set when the plugin starts.
 *  In most cases, you shouldn't have to modify this default behavior.
 *
 * @example
 * server.pluginManager.register('sync', pluginSync);
 */
export default class ServerPluginSync extends ServerPlugin {
  /** @hideconstructor */
  constructor(server, id, options) {
    super(server, id);

    const defaults = {
      getTimeFunction: getTime,
    };

    this.options = Object.assign(defaults, options);

    if (!isFunction(this.options.getTimeFunction)) {
      throw new Error(`Cannot construct 'ServerPluginSync': Invalid 'getTimeFunction' option: 'getTimeFunction' must be a function`);
    }

    this._sync = null;
  }

  /** @private */
  async start() {
    await super.start();

    this._sync = new SyncServer(this.options.getTimeFunction);
  }

  /** @private */
  async addClient(client) {
    await super.addClient(client);

    const sendCache = new Array(4);
    const sendFunction = (id, clientPingTime, serverPingTime, serverPongTime) => {
      sendCache[0] = id;
      sendCache[1] = clientPingTime;
      sendCache[2] = serverPingTime;
      sendCache[3] = serverPongTime;

      client.socket.send(`sw:${this.id}:pong`, sendCache);
    };

    const receiveFunction = callback => {
      client.socket.addListener(`sw:${this.id}:ping`, data => {
        const id = data[0];
        const clientPingTime = data[1];

        callback(id, clientPingTime);
      });
    };

    this._sync.start(sendFunction, receiveFunction);
  }

  /** @private */
  async removeClient(client) {
    client.socket.removeAllListeners(`sw:${this.id}:ping`);
    await super.removeClient(client);
  }


  /**
   * Time of the local clock. If no arguments provided, returns the current
   * local time, else performs the conversion between the given sync time
   * and the associated local time.
   *
   * @note: server-side, `getLocalTime` and `getSyncTime` are identical
   *
   * @param {Number} [syncTime] - optional, time from the sync clock (sec).
   * @return {Number} Local time corresponding to the given sync time (sec).
   */
  getLocalTime(syncTime) {
    return this._sync.getLocalTime(syncTime);
  }

  /**
   * Time of the synced clock. If no arguments provided, returns the current
   * sync time, else performs the conversion between the given local time
   * and the associated sync time.
   *
   * @note: server-side, `getLocalTime` and `getSyncTime` are identical
   *
   * @param {Number} [localTime] - optional, time from the local clock (sec).
   * @return {Number} Sync time corresponding to the given local time (sec).
   */
  getSyncTime(localTime) {
    return this._sync.getSyncTime(localTime);
  }
};
