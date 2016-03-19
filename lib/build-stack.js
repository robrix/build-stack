'use babel';

import fs from 'fs';
import path from 'path';
import util from 'util';
import { Task } from 'atom';
import EventEmitter from 'events';
import consistentEnv from 'consistent-env';

export function provideBuilder() {
  return class StackBuildProvider extends EventEmitter {
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
      return
        [ { name: "All"
          , exec: "stack build"
          , env: consistentEnv()
          }
        ];
    }
  };
}
