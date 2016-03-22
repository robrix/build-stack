'use babel';

import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import consistentEnv from 'consistent-env';
import {spawn} from 'child-process-promise';
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
    const errorMatch = [ '\\s*(?<file>[^\\s].*\\.l?hs):(?<line>\\d+):((?<col>\\d+):)?' ];
    const all = { name: 'All',
      exec: 'stack',
      args: [ 'build' ],
      sh: false,
      env: consistentEnv(),
      errorMatch: errorMatch,
      variants: {
        test: { args: [ 'test' ] },
        clean: { args: [ 'clean' ] },
        profile: { args: [ 'profile' ] },
        benchmark: { args: [ 'benchmark' ] },
      }
    };
    return spawn('stack', [ 'ide', 'packages' ], { cwd: this.cwd, capture: [ 'stdout' ] })
      .then(result => [ all ].concat(
        result.stdout.toString().split('\n')
        .filter(name => name !== '')
        .map(name => ({
          name: name,
          exec: 'stack',
          args: [ 'build', name ],
          sh: false,
          env: consistentEnv(),
          errorMatch: errorMatch,
          variants: {
            test: { args: [ 'test', name ] },
            clean: { args: [ 'clean', name ] },
            profile: { args: [ 'profile', name ] },
            benchmark: { args: [ 'benchmark', name ] },
          }
        }))));
  }
}

export function provideBuilder() {
  return StackBuilder;
}
