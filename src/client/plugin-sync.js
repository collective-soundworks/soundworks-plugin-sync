import { SyncClient } from '@ircam/sync';

/**
 * Interface for the client `'sync'` service.
 *
 * The `sync` service synchronizes the a given local clock of the client with
 * the clock of the server (master clock). It internally relies on the `WebAudio`
 * clock and then requires the `platform` service to access this feature.
 *
 * _Note:_ the service is based on
 * [`github.com/collective-soundworks/sync`](https://github.com/collective-soundworks/sync).
 *
 * @example
 * // inside the experience constructor
 * this.sync = this.require('sync', {
 *   getTimeFunction: () => audioContext.currentTime
 * });
 * // when the experience has started, translate the sync time in local time
 * const syncTime = this.sync.getSyncTime();
 * const localTime = this.sync.getLocalTime(syncTime);
 */
const pluginFactory = function(AbstractPlugin) {

  return class PluginSync extends AbstractPlugin {
    constructor(client, name, options) {
      super(client, name);

      const startTime = Date.now() * 0.001

      const defaults = {
        getTimeFunction: () => Date.now() * 0.001 - startTime,
        globalReport: false, // do not document for now, for tests and internal use
        // localReport: true,
      };

      this.options = this.configure(defaults, options);

      this.getLocalTime = this.getLocalTime.bind(this);
      this.getSyncTime = this.getSyncTime.bind(this);

      this._onReport = report => {};
      this._report = null;
      this._ready = false;
    }

    async start() {
      this.state = await this.client.stateManager.create(`s:${this.name}`);
      this._sync = new SyncClient(this.options.getTimeFunction);

      const sendCache = new Float32Array(2);
      const sendFunction = (id, clientPingTime) => {
        sendCache[0] = id;
        sendCache[1] = clientPingTime;

        this.client.socket.sendBinary(`s:${this.name}:ping`, sendCache);
      };

      const receiveFunction = callback => {
        this.client.socket.addBinaryListener(`s:${this.name}:pong`, data => {
          const id = data[0];
          const clientPingTime = data[1];
          const serverPingTime = data[2];
          const serverPongTime = data[3];

          callback(id, clientPingTime, serverPingTime, serverPongTime);
        });
      };

      this._sync.start(sendFunction, receiveFunction, (report) => {
        if (this.options.globalReport === true) {
          this.state.set({ report });
        }

        if (report.status === 'training' || report.status === 'sync') {
          if (this.signals.ready.value === false) {
            this.ready();
          }
        }

        this._report = report;
        this._onReport(this._report);
      });

      this.started();
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
     * Subscribe to reports
     * @param {Function} callback
     */
    onReport(callback) {
      this._onReport = callback;
    }

    /**
     * Get current report
     * @return {Object} report
     */
    getReport(callback) {
      return this._report;
    }
  }
}

export default pluginFactory;
