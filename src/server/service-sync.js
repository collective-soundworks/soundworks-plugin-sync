import { SyncServer } from '@ircam/sync';

const schema = {
  report: {
    type: 'any',
    default: null,
    nullable: true,
  }
};

const serviceFactory = function(Service) {

  return class ServiceSync extends Service {
    constructor(server, name, options) {
      super(server, name);

      const startTime = process.hrtime();
      const defaults = {
        getTimeFunction: () => {
          const now = process.hrtime(startTime);
          return now[0] + now[1] * 1e-9;
        },
      };

      this.options = this.configure(defaults, options);
      this.states = new Map();
      this._sync = null;

      this.server.stateManager.registerSchema(`s:${this.name}`, schema);
    }

    start() {
      this._sync = new SyncServer(this.options.getTimeFunction);

      this.server.stateManager.observe(async (schemaName, clientId) => {
        if (schemaName === `s:${this.name}`) {
          const state = await this.server.stateManager.attach(schemaName, clientId);

          this.states.set(clientId, state);

          state.onDetach(() => {
            this.states.delete(clientId);
          });
        }
      });

      this.started();
      this.ready();
    }

    connect(client) {
      super.connect(client);

      const sendCache = new Float32Array(4);

      const sendFunction = (id, clientPingTime, serverPingTime, serverPongTime) => {
        sendCache[0] = id;
        sendCache[1] = clientPingTime;
        sendCache[2] = serverPingTime;
        sendCache[3] = serverPongTime;

        client.socket.sendBinary(`s:${this.name}:pong`, sendCache);
      };

      const receiveFunction = callback => {
        client.socket.addBinaryListener(`s:${this.name}:ping`, data => {
          const id = data[0];
          const clientPingTime = data[1];

          callback(id, clientPingTime);
        });
      };

      this._sync.start(sendFunction, receiveFunction);
    }

    disconnect(client) {
      super.disconnect(client);
    }


    /**
     * Time of the local clock. If no arguments provided, returns the current
     * local time, else performs the convertion between the given sync time
     * and the associated local time.
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
     * @note: server-side, `getLocalTime` and `getSyncTime` are identical
     *
     * @param {Number} [audioTime] - optionnal, time from the local clock (sec).
     * @return {Number} - Sync time corresponding to the given local time (sec).
     */
    getSyncTime(localTime) {
      return this._sync.getSyncTime(localTime);
    }
  }
}

// not mandatory
serviceFactory.defaultName = 'service-sync';

export default serviceFactory;
