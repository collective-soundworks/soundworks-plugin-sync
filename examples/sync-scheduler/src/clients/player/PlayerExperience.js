import { Experience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import { renderSyncService, renderErroredSyncService } from './service-views';
import masters from 'waves-masters';

class PlayerExperience extends Experience {
  constructor(client, options = {}, $container, audioContext, errored, index) {
    super(client, options);

    this.options = options;
    this.$container = $container;
    this.audioContext = audioContext;
    this.errored = errored;
    this.index = index;

    this.platform = this.require('platform');
    this.sync = this.require('sync');

    this.client.serviceManager.observe(status => {
      if (status['sync'] === 'started') {
        renderSyncService(this.options, this.$container);
      } else if (status['sync'] === 'errored') {
        renderErroredSyncService(this.options, this.$container);
      }
    });

    this.renderApp('Initializing...');
  }

  start() {
    super.start();

    // force service error rendering
    if (this.errored) {
      renderErroredSyncService(this.options, this.$container);
      return;
    }

    // -----------------------------------------------------
    // sync scheduler and metro
    // -----------------------------------------------------

    // schedule things in sync time
    const scheduler = new masters.Scheduler(this.sync.getSyncTime, {
      // give scheduler a way to map sync time to audio time
      currentTimeToAudioTimeFunction: this.sync.getLocalTime,
    });

    const period = 1;
    const audioContext = this.audioContext;
    const mult = this.index + 1;
    console.log(mult);
    const metro = {
      advanceTime(syncTime) {
        // play using audio time
        const audioTime = this.master.audioTime;
        // equivalent to: `this.sync.getLocalTime(syncTime);`
        const osc = audioContext.createOscillator();
        osc.frequency.value = 200 * mult;
        osc.connect(audioContext.destination);

        osc.start(audioTime);
        osc.stop(audioTime + 0.01);
        // schedule next tick in sync time
        return syncTime + period;
      }
    }

    const nextSyncTime = Math.ceil(this.sync.getSyncTime());
    scheduler.add(metro, nextSyncTime);

    // -----------------------------------------------------
    // display clock
    // -----------------------------------------------------
    let currentStatus = null;

    this.sync.state.subscribe(status => {
      currentStatus = status;
    });

    setInterval(() => {
      const syncTime = this.sync.getSyncTime();
      const localTime = this.sync.getLocalTime();

      this.renderApp('sync', syncTime, localTime, currentStatus);
    }, 50);

  }

  renderApp(msg, syncTime, localTime, currentStatus) {
    render(html`
      <section class="screen aligner">
        <div>
          <h1>${msg}</p>
          <p class="normal">${syncTime ? `syncTime: ${syncTime.toFixed(3)}` : ''}</p>
          <p class="normal">${localTime ? `localTime: ${localTime.toFixed(3)}` : ''}</p>
          <pre><code>${currentStatus ? JSON.stringify(currentStatus, null, 2) : ''}</code></pre>
        </div>
      </section>
    `, this.$container);
  }
}

export default PlayerExperience;
