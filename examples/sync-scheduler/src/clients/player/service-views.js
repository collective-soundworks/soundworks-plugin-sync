import { render, html } from 'lit-html';

export function renderSyncService(options, $container) {
  render(html`
    <div class="screen">
      <section class="half-screen aligner">
        <div class="align-center">
          <h1 class="title">${options.app.name}</h1>
          <p class="author">${options.app.author ? `By ${options.app.author}` : ''}</p>
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
  `, $container);
}

export function renderErroredSyncService(options, $container) {
  render(html`
    <div class="screen">
      <section class="half-screen aligner">
        <div class="align-center">
          <h1 class="title">${options.app.name}</h1>
          <p class="author">${options.app.author ? `By ${options.app.author}` : ''}</p>
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
  `, $container);
}
