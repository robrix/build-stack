'use babel';

import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import consistentEnv from 'consistent-env';
import child_process from 'child_process';
import {CompositeDisposable} from 'atom';

let subscriptions = null;
export function activate() {
  subscriptions = new CompositeDisposable();
}

export function deactivate() {
  subscriptions.dispose();
}

let linter = null;
export function consumeLinter(registry) {
  linter = registry.register({ name: 'stack' });
  subscriptions.add(linter);
}

class StackBuilder extends EventEmitter {
  constructor(cwd) {
    super();
    this.cwd = cwd;
  }

  getNiceName() {
    return 'stack';
  }

  isEligible() {
    this.file = [ 'stack.yaml', 'stack.yml' ]
      .map(file => path.join(this.cwd, file))
      .filter(fs.existsSync)
      .slice(0, 1)
      .pop();
    return !!this.file;
  }

  settings() {
    const all = { name: 'All',
      exec: 'stack',
      args: [ 'build' ],
      sh: false,
      env: consistentEnv(),
      errorMatch: [ '(?<file>.+\\.l?hs):(?<line>\\d+):(?<col>\\d+):' ]
    };

    const proc = child_process.spawnSync('stack', [ 'ide', 'packages' ], {cwd: this.cwd});
    return [ all ]
      .concat(proc.stdout.toString().split('\n')
      .filter(name => name !== '')
      .map(name => ({
        name: name,
        exec: 'stack',
        args: [ 'build', name ],
        sh: false,
        env: consistentEnv(),
        errorMatch: [ '(?<file>.+\\.l?hs):(?<line>\\d+):(?<col>\\d+):' ]
      })));
  }
}

export function provideBuilder() {
  return StackBuilder;
}
