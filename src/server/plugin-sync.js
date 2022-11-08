import { SyncServer } from '@ircam/sync';

function isFunction(func) {
  return Object.prototype.toString.call(func) == '[object Function]' ||
    Object.prototype.toString.call(func) == '[object AsyncFunction]';
}

export default function(Plugin) {
  return class PluginSync extends Plugin {
    constructor(server, id, options) {
      super(server, id);

      // @todo - update w/ some getTime librarie (`sc-get-time`)
      const startTime = process.hrtime();
      const defaults = {
        getTimeFunction: () => {
          const now = process.hrtime(startTime);
          return now[0] + now[1] * 1e-9;
        },
      };

      this.options = Object.assign({}, defaults, options);

      if (!isFunction(this.options.getTimeFunction)) {
        throw new Error(`[soundworks:PluginSync] Invalid option "getTimeFunction", "getTimeFunction" is mandatory and should be a function`);
      }

      this._sync = null;
    }

    async start() {
      this._sync = new SyncServer(this.options.getTimeFunction);
    }

    async addClient(client) {
      await super.addClient(client);

      const sendCache = new Float64Array(4);

      const sendFunction = (id, clientPingTime, serverPingTime, serverPongTime) => {
        sendCache[0] = id;
        sendCache[1] = clientPingTime;
        sendCache[2] = serverPingTime;
        sendCache[3] = serverPongTime;

        client.socket.sendBinary(`s:${this.id}:pong`, sendCache);
      };

      const receiveFunction = callback => {
        client.socket.addBinaryListener(`s:${this.id}:ping`, data => {
          const id = data[0];
          const clientPingTime = data[1];

          callback(id, clientPingTime);
        });
      };

      this._sync.start(sendFunction, receiveFunction);
    }

    async removeClient(client) {
      client.socket.removeAllBinaryListeners(`s:${this.id}:ping`);
      await super.removeClient(client);
    }


    /**
     * Time of the local clock. If no arguments provided, returns the current
     * local time, else performs the convertion between the given sync time
     * and the associated local time.
     *
     * @note: server-side, `getLocalTime` and `getSyncTime` are identical
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
     * @note: server-side, `getLocalTime` and `getSyncTime` are identical
     *
     * @param {Number} [localTime] - optionnal, time from the local clock (sec).
     * @return {Number} - Sync time corresponding to the given local time (sec).
     */
    getSyncTime(localTime) {
      return this._sync.getSyncTime(localTime);
    }
  };
}
