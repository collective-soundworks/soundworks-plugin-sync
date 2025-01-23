import { assert } from 'chai';

import { Server } from '@soundworks/core/server.js';
import { Client } from '@soundworks/core/client.js';

import ServerPluginSync from '../src/ServerPluginSync.js';
import ClientPluginSync from '../src/ClientPluginSync.js';

const config = {
  app: {
    name: 'test-plugin-sync',
    clients: {
      test: {
        runtime: 'node',
      },
    },
  },
  env: {
    port: 8080,
    serverAddress: '127.0.0.1',
    useHttps: false,
    verbose: false,
  },
};

describe('PluginSync', () => {
  describe('constructor(server|client, id, options)', () => {
    it('[server] should throw if "options.getTimeFunction" is not a function', async () => {
      const server = new Server(config);

      let errored = false;

      try {
        server.pluginManager.register('sync', ServerPluginSync, {
          getTimeFunction: 'not a function',
        });
      } catch (err) {
        errored = true;
        console.log(err.message);
      }

      assert.isTrue(errored);
    });

    it('[client] should throw if "options.getTimeFunction" is not a function', async () => {
      const server = new Server(config);
      server.pluginManager.register('sync', ServerPluginSync);
      await server.start();

      const client = new Client({ role: 'test', ...config });

      let errored = false;
      try {
        client.pluginManager.register('sync', ClientPluginSync, {
          getTimeFunction: 'not a function',
        });
      } catch (err) {
        errored = true;
        console.log(err.message);
      }

      // stop the server
      await server.stop();
      assert.isTrue(errored);
    });

    it('[client] should throw if "options.onReport" is not a function', async () => {
      const server = new Server(config);
      server.pluginManager.register('sync', ServerPluginSync);
      await server.start();

      const client = new Client({ role: 'test', ...config });

      let errored = false;
      try {
        client.pluginManager.register('sync', ClientPluginSync, {
          onReport: 'not a function',
        });
      } catch (err) {
        errored = true;
        console.log(err.message);
      }

      await server.stop();
      assert.isTrue(errored);
    });

    it('[client] "options.onReport" should accept async functions', async function() {
      this.timeout(3000);

      const server = new Server(config);
      server.pluginManager.register('sync', ServerPluginSync);
      await server.start();

      let receivedReport = false;
      const client = new Client({ role: 'test', ...config });
      client.pluginManager.register('sync', ClientPluginSync, {
        onReport: async report => {
          assert.isObject(report);
          receivedReport = true;
        },
      });

      try {
        await client.init();
      } catch (err) {
        assert.fail('should accept async functions');
        console.log(err.message);
      }

      await client.start();
      await client.stop();

      await server.stop();

      assert.equal(receivedReport, true);
    });
  });

  describe('onReport(callback)', () => {
    it('should report the reports', async function() {
      this.timeout(3000);

      const server = new Server(config);
      server.pluginManager.register('sync', ServerPluginSync);
      await server.init();
      await server.start();


      const client = new Client({ role: 'test', ...config });

      let receivedReport = false;
      client.pluginManager.register('sync', ClientPluginSync, {
        onReport: async (report) => {
          console.log(report);
          receivedReport = true;
          assert.isObject(report);
        },
      });

      // client.start resolves when on report is called for the first time,
      // so await is sufficient here
      await client.start();
      await client.stop();

      await server.stop();

      if (!receivedReport) {
        assert.fail('should have received report');
      }
    });
  });

  describe('sync process', () => {
    it('should properly synchronize a client to a server', async function() {
      this.timeout(20000);

      const server = new Server(config);
      server.pluginManager.register('sync', ServerPluginSync);
      await server.start();

      const serverSync = await server.pluginManager.get('sync');

      // create a client which click as a randomized offset
      const client = new Client({ role: 'test', ...config });

      const startTime = process.hrtime();
      const randomOffset = Math.round((Math.random() * 2 - 1) * 1e9);

      client.pluginManager.register('sync', ClientPluginSync, {
        getTimeFunction: () => {
          const now = process.hrtime(startTime);
          return now[0] + now[1] * 1e-9 - randomOffset;
        },
      });

      await client.start();

      const clientSync = await client.pluginManager.get('sync');

      // log sync time from both sides
      let intervalId = setInterval(() => {
        console.log('server:', serverSync.getSyncTime());
        console.log('client:', clientSync.getSyncTime(), '\t - localTime:', clientSync.getLocalTime());
        console.log('----------------------------------');
      }, 1000);

      await new Promise(resolve => setTimeout(resolve, 10 * 1000));
      clearInterval(intervalId);
      client.stop();
      server.stop();
    });
  });
});

