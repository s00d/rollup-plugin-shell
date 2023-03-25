[![npm version](https://badge.fury.io/js/rollup-plugin-shell-next.svg)](https://badge.fury.io/js/rollup-plugin-shell-next)
[![npm downloads](https://img.shields.io/npm/dw/rollup-plugin-shell-next)](https://badge.fury.io/js/rollup-plugin-shell-next)
[![NPM license](https://img.shields.io/npm/l/rollup-plugin-shell-next)](https://github.com/s00d/rollup-plugin-shell-next/blob/master/LICENSE)
[![npm type definitions](https://img.shields.io/npm/types/rollup-plugin-shell-next)](https://github.com/s00d/rollup-plugin-shell-next)
![Build Status](https://github.com/s00d/rollup-plugin-shell-next/workflows/Node.js%20CI/badge.svg?branch=master)
[![donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.me/s00d)
[![GitHub Repo stars](https://img.shields.io/github/stars/s00d/rollup-plugin-shell-next?style=social)](https://github.com/s00d/rollup-plugin-shell-next)
# Rollup Shell Plugin

This plugin allows you to run any shell commands before or after rollup builds. 

Goes great with running cron jobs, reporting tools, or tests such as selenium, protractor, phantom, ect.


## WARNING

This plugin is meant for running simple command line executions. It is not meant to be a task management tool.

## Installation

`npm install --save-dev rollup-plugin-shell-next`

## Setup
In `rollup.config.js`:

```js
import RollupShellPlugin from '../src/index'
...
module.exports = {
  //...
  plugins: [
    new RollupShellPlugin({
      onBuildStart:{
        scripts: ['echo "Start"'],
        blocking: true,
        parallel: false
      }, 
      onBuildEnd:{
        scripts: ['echo "End"'],
        blocking: false,
        parallel: true
      }
    })
  ]
  //...
}
```
**More example in rollup.config.ts**

### API
* `onBeforeBuild`: array of scripts to execute before every build.
* `onBuildError`: array of scripts to execute when there is an error during compilation.
* `onBuildStart`: configuration object for scripts that execute before a compilation.
* `onBuildEnd`: configuration object for scripts that execute after files are emitted at the end of the compilation.
* `onWatchRun`: configuration object for scripts that execute when rollup's run watch
* `onDoneWatch`: configuration object for scripts that execute after files are emitted at the end of the compilation with watch.
* `onBeforeNormalRun`: configuration object for scripts that execute on normal run without --watch option
* `onAfterDone`: configuration object for scripts that execute after done.
* `onFailedBuild`: configuration object for scripts that execute after error.

***Default for all: ```{scripts: [],blocking: false,parallel: false}```***

* `blocking (onBeforeBuild, onBuildStart, onBuildEnd, onBuildExit, onBuildExit, onWatchRun)`: block rollup until scripts finish execution.
* `parallel (onBeforeBuild, onBuildStart, onBuildEnd, onBuildExit, onBuildExit, onWatchRun)`: execute scripts in parallel, otherwise execute scripts in the order in which they are specified in the scripts array.
* `once (onBeforeBuild, onBuildStart, onBuildEnd, onBuildExit, onBuildExit, onWatchRun)`: execute scripts only once

**Note:** below combination is not supported.
 ```js
{
  blocking: true
  parallel: true
} 
 ```

***Other global params***
* `env`: Object with environment variables that will be applied to the executables **Default: { }**
* `logging`:  show output for internal messages.  **Default: true**
* `swallowError`: ignore script errors (useful in watch mode) **Default: false**
* `dev`: switch for development environments. This causes scripts to execute once. Useful for running HMR on rollup-dev-server or rollup watch mode. **Default: true**
* `safe`: switches script execution process from spawn to exec. If running into problems with spawn, turn this setting on. **Default: false**


```js
new RollupShellPlugin({
      onBeforeNormalRun: {
        // ...
      },
      dev: false,
      safe: false,
      logging: true
    })
  ]
}
```

### once

mode once, calls scripts only 1 time, example:

```js
let plugin = RollupShellPlugin({
    onBeforeBuild: {
        scripts: [
            // ...
        ],
        once: true,
    },
})
    // ...
    plugins: [
        plugin
    ]
    //..
    plugins: [
        plugin
    ]
```


### TypeScript

This project is written in TypeScript, and type declarations are included. You can take advantage of this if your project's rollup configuration is also using TypeScript (e.g. rollup.config.ts and rollup.config.js).

### Function in scripts

how to use functions in the queue?

#### Example:
```js
{
  {
    scripts: [
      // sync
      () => {
        console.log('run tTimeout 1');
        setTimeout(() => console.log('end Timeout 1'), 1000);
      },
      // async
      () => new Promise((resolve, reject) => {
        console.log('run async tTimeout');
        setTimeout(() => {
          console.log('end async tTimeout');
          resolve('ok');
        }, 1000);
      }),
    ],
      blocking: true
  }
}
```

```js
// use exec
import * as os from 'os'
// ..
{
    safe: os.platform() === 'win32', // by default spawn is used everywhere. If you have problems try using safe: true
    scripts: [
      //...
    ]
    //  ...
}
```

### Developing

If opening a pull request, create an issue describing a fix or feature. Have your pull request point to the issue by writing your commits with the issue number in the message.

Make sure you lint your code by running `npm run lint` and you can build the library by running `npm run build`.

I appreciate any feed back as well, Thanks for helping!
