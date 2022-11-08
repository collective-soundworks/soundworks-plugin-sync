import { SyncClient } from '@ircam/sync';

/**
 * The `sync` plugin synchronizes a local clock from the client with
 * the master clock from the server. The local clock against (e.g. some
 * `audioContext.currentTime``) on which the synchronization process is
 * done can be user-defined through the `getTimeFunction` option.
 *
 * The plugin is based on the [`@ircam/sync`](https://github.com/ircam-ismm/sync)
 * library.
 */
export default function(Plugin) {

  /**
   *
   *
   */
  return class PluginSync extends Plugin {
    constructor(client, id, options) {
      super(client, id);

      const startTime = Date.now() * 0.001;

      const defaults = {
        getTimeFunction: () => Date.now() * 0.001 - startTime,
        onReport: null,
      };

      this.options = Object.assign({}, defaults, options);

      if (!(typeof this.options.getTimeFunction === 'function')) {
        throw new Error(`[soundworks:PluginSync] Invalid option "getTimeFunction", "getTimeFunction" is mandatory and should be a function`);
      }

      this.getLocalTime = this.getLocalTime.bind(this);
      this.getSyncTime = this.getSyncTime.bind(this);

      this._onReportCallbacks = new Set();
      this._report = null;

      if (this.options.onReport !== null) {
        this.onReport(this.options.onReport);
      }
    }

    async start() {
      await super.start();

      return new Promise(resolve => {
        this._sync = new SyncClient(this.options.getTimeFunction);

        const sendCache = new Float64Array(2);
        const sendFunction = (id, clientPingTime) => {
          sendCache[0] = id;
          sendCache[1] = clientPingTime;

          this.client.socket.sendBinary(`s:${this.id}:ping`, sendCache);
        };

        const receiveFunction = callback => {
          this.client.socket.addBinaryListener(`s:${this.id}:pong`, data => {
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
     * @return {Number} - Local time corresponding to the given sync time (sec).
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
     * @return {Number} - Sync time corresponding to the given local time (sec).
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
     * Get last report.
     * See [https://github.com/ircam-ismm/sync#SyncClient..reportFunction](https://github.com/ircam-ismm/sync#SyncClient..reportFunction)
     * @return {Object} report
     */
    getReport() {
      return this._report;
    }
  };
}
