import { SyncClient } from '@ircam/sync';
import { isFunction, getTime } from '@ircam/sc-utils';
import { ClientPlugin } from '@soundworks/core/client.js';


/**
 * Client-side representation of the soundworks sync plugin.
 *
 * The constructor should never be called manually. The plugin will be
 * instantiated by soundworks when registered in the `pluginManager`
 *
 * Available options:
 * - `getTimeFunction` {Function} - Function that returns a time in second.
 *  Defaults to `performance.now` is available or `Date.now` on browser clients,
 *  and `process.hrtime` on node clients, all of them with an origin set when
 *  the plugin starts.
 * - `[onReport=null]` {Function} - Function to execute when the synchronization
 *  reports some statistics.
 * - `[syncOptions={}]` {Object} - Options to pass to the underlying sync client
 *  cf. @link{https://github.com/ircam-ismm/sync?tab=readme-ov-file#new_SyncClient_new}
 *
 * @example
 * client.pluginManager.register('sync', ClientPluginSync, {
 *   getTimeFunction: () => audioContext.currentTime,
 * });
 */
export default class ClientPluginSync extends ClientPlugin {
  #onReportCallbacks = new Set();
  #report = null;

  /** @hideconstructor */
  constructor(client, id, options) {
    super(client, id);

    const defaults = {
      getTimeFunction: getTime,
      onReport: null,
      syncOptions: {},
    };

    this.options = Object.assign(defaults, options);

    if (!isFunction(this.options.getTimeFunction)) {
      throw new TypeError(`Cannot construct 'ClientPluginSync': Invalid 'getTimeFunction' option: 'getTimeFunction' must be a function`);
    }

    if (this.options.onReport !== null && !isFunction(this.options.onReport)) {
      throw new TypeError(`Cannot construct 'ClientPluginSync': Invalid 'onReport' option: 'onReport' should be either null or a function`);
    }

    this.getLocalTime = this.getLocalTime.bind(this);
    this.getSyncTime = this.getSyncTime.bind(this);

    if (this.options.onReport !== null) {
      this.onReport(this.options.onReport);
    }
  }

  /** @private */
  async start() {
    await super.start();

    return new Promise(resolve => {
      this._sync = new SyncClient(this.options.getTimeFunction, this.options.syncOptions);

      const sendCache = new Array(2);
      const sendFunction = (id, clientPingTime) => {
        sendCache[0] = id;
        sendCache[1] = clientPingTime;

        this.client.socket.send(`sw:${this.id}:ping`, sendCache);
      };

      const receiveFunction = callback => {
        this.client.socket.addListener(`sw:${this.id}:pong`, data => {
          const id = data[0];
          const clientPingTime = data[1];
          const serverPingTime = data[2];
          const serverPongTime = data[3];

          callback(id, clientPingTime, serverPingTime, serverPongTime);
        });
      };

      this._sync.start(sendFunction, receiveFunction, (report) => {
        // resolve promise on first report
        if (report.status === 'training' || report.status === 'sync') {
          resolve();
        }

        this.#report = report;

        this.#onReportCallbacks.forEach(callback => callback(this.#report));
      });
    });
  }

  async stop() {
    this._sync.stop();
  }

  /**
   * Time of the local clock. If no arguments provided, returns the current
   * local time, else performs the conversion between the given sync time
   * and the associated local time.
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
   * @param {Number} [audioTime] - optional, time from the local clock (sec).
   * @return {Number} Sync time corresponding to the given local time (sec).
   */
  getSyncTime(localTime) {
    return this._sync.getSyncTime(localTime);
  }

  /**
   * Subscribe to reports from the sync process.
   * See [https://github.com/ircam-ismm/sync#SyncClient..reportFunction](https://github.com/ircam-ismm/sync#SyncClient..reportFunction)
   * @param {Function} callback
   */
  onReport(callback) {
    if (!(typeof callback === 'function')) {
      throw new TypeError(`Cannot execute 'onReport' on ClientPluginSync: Argument 1 should be a function`);
    }

    this.#onReportCallbacks.add(callback);
    return () => this.#onReportCallbacks.delete(callback);
  }

  /**
   * Get last statistics from the synchronization process.
   * See [https://github.com/ircam-ismm/sync#SyncClient..reportFunction](https://github.com/ircam-ismm/sync#SyncClient..reportFunction)
   * @return {Object} The last report
   */
  getReport() {
    return this.#report;
  }
};
