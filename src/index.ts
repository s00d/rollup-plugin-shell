import { Plugin } from 'rollup';
import { spawn, exec, spawnSync, execSync, ChildProcess, ExecException } from 'child_process'
import { Options, Script, Tasks, Task } from './types'
import { Readable } from 'stream'

const defaultTask: Tasks = {
    scripts: [],
    blocking: false,
    parallel: false,
    once: false,
}

export default function shellPlugin(options: Options): Plugin {
    const validateEvent = function(tasks: Tasks | string | Function | undefined | null): Tasks & {once_ext: boolean} {
        if (!tasks) {
            return {...JSON.parse(JSON.stringify(defaultTask)), once_ext: false}
        }
        if (typeof tasks === 'string') {
            return { scripts: tasks.split('&&'), blocking: false, parallel: false, once: false, once_ext: false }
        } else if (typeof tasks === 'function') {
            return { scripts: [tasks], blocking: false, parallel: false, once: false, once_ext: false }
        }

        return { ...tasks, once_ext: false }
    }

    const log = function(text: string) {
        if (options.logging) {
            console.log(text)
        }
    }

    const warn = function(text: string) {
        if (options.logging) {
            console.warn(text)
        }
    }

    const error = function (text: string) {
        if (options.logging) {
            console.error(text)
        }
    }

    const onBeforeBuild = validateEvent(options.onBeforeBuild)
    const onBeforeNormalRun = validateEvent(options.onBeforeNormalRun)
    const onBuildStart = validateEvent(options.onBuildStart)
    const onBuildEnd = validateEvent(options.onBuildEnd)
    const onBuildError = validateEvent(options.onBuildError)
    const onWatchRun = validateEvent(options.onWatchRun)
    const onDoneWatch = validateEvent(options.onDoneWatch)
    const onAfterDone = validateEvent(options.onAfterDone)
    const onFailedBuild = validateEvent(options.onFailedBuild)

    const serializeScript = function(script: string | Script): Script {
        if (typeof script === 'string') {
            const [command, ...args] = script.split(' ')
            return { command, args }
        }
        const { command, args } = script
        return { command, args }
    }

    const handleScript = function(script: string) {
        if (options.safe) {
            return execSync(script, { maxBuffer: Number.MAX_SAFE_INTEGER, stdio: options.logging ? [0, 1, 2] : undefined })
        }

        const { command, args } = serializeScript(script)
        let env = Object.create(global.process.env)
        env = Object.assign(env, options.env)
        const result = spawnSync(command, args, { stdio: options.logging ? ['inherit', 'inherit', 'pipe'] : undefined, env, shell: options.shell })
        if (options.logging && result.status !== 0) {
            error(`stderr error ${command} ${args.join(' ')}: ${result.stderr}`)
        }
        return result
    }

    const spreadStdoutAndStdErr = function (proc: ChildProcess) {
        if (!proc.stdout || !proc.stderr) return
        proc.stdout.pipe(process.stdout)
        proc.stderr.pipe(process.stdout)
    }

    const putsAsync = function (resolve: (val: any) => void) {
        return (error: ExecException | null, stdout: string, stderr: string) => {
            if (error && !options.swallowError) {
                throw error
            }
            resolve(error)
        }
    }

    const puts = function (error: Error, stdout: Readable, stderr: Readable) {
        if (error && !options.swallowError) {
            throw error
        }
    }
    const handleScriptAsync = function (script: string) {
        if (options.safe) {
            return new Promise((resolve) => {
                spreadStdoutAndStdErr(exec(script, putsAsync(resolve)))
            })
        }

        const { command, args } = serializeScript(script)
        let env = Object.create(global.process.env)
        env = Object.assign(env, options.env)
        const proc = spawn(command, args, { stdio: 'inherit', env: env, shell: options.shell })
        if (options.logging) {
            proc.on('error', (err) => {
                error(`stderr error ${command} ${args.join(' ')}: ${err.message}`)
            })
        }
        return new Promise((resolve) => proc.on('close', putsAsync(resolve)))
    }

    const executeScripts = async function(scripts: Task[], parallel = false, blocking = false) {
        if (!scripts || scripts.length <= 0) {
            return
        }

        if (blocking && parallel) {
            throw new Error(`WebpackShellPlugin [${new Date()}]: Not supported`)
        }

        for (let i = 0; i < scripts.length; i++) {
            const script: Task = scripts[i]
            if (typeof script === 'function') {
                // if(script instanceof Promise)
                if (blocking) {
                    await script()
                } else {
                    script()
                }
                continue
            }
            if (blocking) {
                handleScript(script)
            } else if (!blocking) {
                if (parallel) handleScriptAsync(script); else await handleScriptAsync(script)
            }
        }
    }

    return {
        name: 'plugin-shell',
        async buildStart() {
            if (this.meta.watchMode) {
                if (!onWatchRun.once || !onWatchRun.once_ext) {
                    if(onWatchRun.once) onWatchRun.once_ext = true;
                    if (onWatchRun.scripts && onWatchRun.scripts.length) {
                        log('Executing onWatchRun build scripts')
                        await executeScripts(onWatchRun.scripts, onWatchRun.parallel, onWatchRun.blocking)
                        if (options.dev) {
                            options.onWatchRun = JSON.parse(JSON.stringify(defaultTask))
                        }
                    }
                }
            } else {
                if (!onBeforeNormalRun.once || !onBeforeNormalRun.once_ext) {
                    if (onBeforeNormalRun.once) onBeforeNormalRun.once_ext = true;
                    if (onBeforeNormalRun.scripts && onBeforeNormalRun.scripts.length > 0) {
                        log('Executing pre-run scripts')
                        await executeScripts(onBeforeNormalRun.scripts, onBeforeNormalRun.parallel, onBeforeNormalRun.blocking)
                        if (options.dev) {
                            options.onDoneWatch = JSON.parse(JSON.stringify(defaultTask))
                        }
                    }
                }
            }

            if (!onBeforeBuild.once || !onBeforeBuild.once_ext) {
                if (onBeforeBuild.once) onBeforeBuild.once_ext = true;

                if (onBeforeBuild.scripts && onBeforeBuild.scripts.length) {
                    log('Executing before build scripts')
                    await executeScripts(onBeforeBuild.scripts, onBeforeBuild.parallel, onBeforeBuild.blocking)
                    if (options.dev) {
                        options.onBeforeBuild = JSON.parse(JSON.stringify(defaultTask))
                    }
                }
            }
        },
        async resolveId() {
            if (!onBuildStart.once || !onBuildStart.once_ext) {
                if (onBuildStart.once) onBeforeBuild.once_ext = true;

                if (onBuildStart.scripts && onBuildStart.scripts.length > 0) {
                    log('Executing pre-build scripts')
                    await executeScripts(onBuildStart.scripts, onBuildStart.parallel, onBuildStart.blocking)
                    if (options.dev) {
                        options.onBuildStart = JSON.parse(JSON.stringify(defaultTask))
                    }
                }
            }
        },
        async load() {

        },
        async transform() {

        },
        async buildEnd(error) {
            if(error) {
                if (!onBuildError.once || !onBuildError.once_ext) {
                    if (onBuildError.once) onBuildError.once_ext = true;
                    if (onBuildError.scripts && onBuildError.scripts.length > 0) {
                        warn('Executing error scripts before exit')
                        await executeScripts(onBuildError.scripts, onBuildError.parallel, onBuildError.blocking)
                        if (options.dev) {
                            options.onBuildError = JSON.parse(JSON.stringify(defaultTask))
                        }
                    }
                }
                return;
            }

            if (!onBuildEnd.once || !onBuildEnd.once_ext) {
                if (onBuildEnd.once) onBuildEnd.once_ext = true;
                if (onBuildEnd.scripts && onBuildEnd.scripts.length > 0) {
                    log('Executing post-build scripts')
                    await executeScripts(onBuildEnd.scripts, onBuildEnd.parallel, onBuildEnd.blocking)
                    if (options.dev) {
                        options.onBuildEnd = JSON.parse(JSON.stringify(defaultTask))
                    }
                }
            }
        },
        async renderStart() {

        },
        async generateBundle() {

        },
        async writeBundle() {

        },
        async closeBundle() {
            if (!onAfterDone.once || !onAfterDone.once_ext) {
                if (onAfterDone.once) onAfterDone.once_ext = true;
                if (onAfterDone.scripts && onAfterDone.scripts.length > 0) {
                    log('Executing additional scripts before exit')
                    await executeScripts(onAfterDone.scripts, onAfterDone.parallel, onAfterDone.blocking)
                    if (options.dev) {
                        options.onAfterDone = JSON.parse(JSON.stringify(defaultTask))
                    }
                }
            }
        },
        async renderError() {
            if (!onFailedBuild.once || !onFailedBuild.once_ext) {
                if (onFailedBuild.once) onFailedBuild.once_ext = true;
                if (onFailedBuild.scripts && onFailedBuild.scripts.length) {
                    log('Executing before build scripts')
                    await executeScripts(onFailedBuild.scripts, onFailedBuild.parallel, onFailedBuild.blocking)
                    if (options.dev) {
                        options.onBeforeBuild = JSON.parse(JSON.stringify(defaultTask))
                    }
                }
            }
        },
        async moduleParsed() {

        },
        async watchChange() {

        },
        async closeWatcher() {
            if (!onDoneWatch.once || !onDoneWatch.once_ext) {
                if (onDoneWatch.once) onDoneWatch.once_ext = true;
                if (onDoneWatch.scripts && onDoneWatch.scripts.length > 0) {
                    log('Executing additional scripts before exit')
                    await executeScripts(onDoneWatch.scripts, onDoneWatch.parallel, onDoneWatch.blocking)
                    if (options.dev) {
                        options.onDoneWatch = JSON.parse(JSON.stringify(defaultTask))
                    }
                }
            }
        },
    };
}
