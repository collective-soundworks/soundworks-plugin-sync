import { Experience } from '@soundworks/core/server';

class PlayerExperience extends Experience {
  constructor(server, clientTypes, options = {}) {
    super(server, clientTypes);

    this.sync = this.require('sync');
  }

  start() {
    super.start();
  }

  enter(client) {
    super.enter(client);
  }

  exit(client) {
    super.exit(client);
  }
}

export default PlayerExperience;
