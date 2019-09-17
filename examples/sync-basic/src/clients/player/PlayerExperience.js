import { Experience } from '@soundworks/core/client';
import { render, html } from 'lit-html';


class PlayerExperience extends Experience {
  constructor(client, options = {}, $container, errored) {
    super(client, options);

    this.options = options;
    this.$container = $container;
    this.errored = errored;

    this.sync = this.require('sync');

    this.client.serviceManager.observe(status => {
      if (status['sync'] === 'started') {
        this.renderSyncService();
      } else if (status['sync'] === 'errored') {
        this.renderErroredSyncService();
      }
    });

    this.renderApp('Initializing...');
  }

  start() {
    super.start();

    if (this.errored) {
      this.renderErroredSyncService();
      return;
    }

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

  renderSyncService() {
    render(html`
      <div class="screen">
        <section class="half-screen aligner">
          <div class="align-center">
            <h1 class="title">${this.options.app.name}</h1>
            <p class="author">${this.options.app.author ? `By ${this.options.app.author}` : ''}</p>
          </div>
        </section>
        <section class="half-screen aligner services">
          <div>
            <ul>
              <li class="italic normal">Please wait while</li>
              <li class="normal initialization-item">syncing<span>.</span><span>.</span><span>.</span></li>
            </ul>
          </div>
        </section>
      </div>
    `, this.$container);
  }

  renderErroredSyncService() {
        render(html`
      <div class="screen">
        <section class="half-screen aligner">
          <div class="align-center">
            <h1 class="title">${this.options.app.name}</h1>
            <p class="author">${this.options.app.author ? `By ${this.options.app.author}` : ''}</p>
          </div>
        </section>
        <section class="half-screen aligner services">
          <div>
            <ul>
              <li class="italic normal error">Sorry,</li>
              <li class="italic normal error">An error occured while...</li>
              <li class="normal error-item">syncing</li>
            </ul>
          </div>
        </section>
      </div>
    `, this.$container);
  }

  renderApp(msg, syncTime, localTime, currentStatus) {
    render(html`
      <section class="screen aligner">
        <div>
          <p>&nbsp;</p>
          <p class="normal">${syncTime ? `syncTime: ${syncTime.toFixed(3)}` : ''}</p>
          <p class="normal">${localTime ? `localTime: ${localTime.toFixed(3)}` : ''}</p>
          <pre><code>${currentStatus ? JSON.stringify(currentStatus, null, 2) : ''}</code></pre>
        </div>
      </section>
    `, this.$container);
  }
}

export default PlayerExperience;
