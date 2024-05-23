import { SyncClient } from '@ircam/sync';
import { isFunction } from '@ircam/sc-utils';
import { getTime } from '@ircam/sc-gettime';

export default function(Plugin) {
  /**
   * Client-side representation of the soundworks sync plugin.
   */
  class PluginSyncClient extends Plugin {
    /**
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
     * client.pluginManager.register('sync', pluginSync, {
     *   getTimeFunction: () => audioContext.currentTime,
     * });
     */
    constructor(client, id, options) {
      super(client, id);

      const defaults = {
        getTimeFunction: getTime,
        onReport: null,
        syncOptions: {},
      };

      this.options = Object.assign(defaults, options);

      if (!isFunction(this.options.getTimeFunction)) {
        throw new Error(`[soundworks:PluginSync] Invalid option "getTimeFunction", "getTimeFunction" is mandatory and should be a function`);
      }

      if (this.options.onReport !== null && !isFunction(this.options.onReport)) {
        throw new Error(`[soundworks:PluginSync] Invalid option "onReport", "onReport" should be null or a function`);
      }

      this.getLocalTime = this.getLocalTime.bind(this);
      this.getSyncTime = this.getSyncTime.bind(this);

      this._onReportCallbacks = new Set();
      this._report = null;

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
          // resolove promise on first report
          if (report.status === 'training' || report.status === 'sync') {
            resolve();
          }

          this._report = report;

          this._onReportCallbacks.forEach(callback => callback(this._report));
        });
      });
    }

    async stop() {
      this._sync.stop();
    }

    /**
     * Time of the local clock. If no arguments provided, returns the current
     * local time, else performs the convertion between the given sync time
     * and the associated local time.
     *
     * @param {Number} [syncTime] - optionnal, time from the sync clock (sec).
     * @return {Number} Local time corresponding to the given sync time (sec).
     */
    getLocalTime(syncTime) {
      return this._sync.getLocalTime(syncTime);
    }

    /**
     * Time of the synced clock. If no arguments provided, returns the current
     * sync time, else performs the convertion between the given local time
     * and the associated sync time.
     *
     * @param {Number} [audioTime] - optionnal, time from the local clock (sec).
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
        throw new Error(`[soundworks:PluginSync] Invalid param "onReport", "onReport" should be a function`);
      }

      this._onReportCallbacks.add(callback);

      return () => this._onReportCallbacks.delete(callback);
    }

    /**
     * Get last statistics from the synchronaization process.
     * See [https://github.com/ircam-ismm/sync#SyncClient..reportFunction](https://github.com/ircam-ismm/sync#SyncClient..reportFunction)
     * @return {Object} The last report
     */
    getReport() {
      return this._report;
    }
  };

  return PluginSyncClient;
}
