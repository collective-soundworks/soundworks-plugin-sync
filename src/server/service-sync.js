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
      this.ready();

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
  }
}

// not mandatory
serviceFactory.defaultName = 'service-sync';

export default serviceFactory;
