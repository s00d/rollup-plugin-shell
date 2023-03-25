import * as path from 'path'
import RollupShellPlugin from '../src/index'
import rimraf from 'rimraf'
import * as fs from 'fs'
import {rollup} from "rollup";

import { error } from "console";

console.log = (data: any) => {}

beforeEach(() => {
    return rimraf.sync(path.resolve(__dirname, 'out'))
})

// afterEach(() => {
//     return rimraf.sync(path.resolve(__dirname, 'out'))
// })

it('Supports an entry', (done) => {
    expect(() => {
        rollup({
            input: path.resolve(__dirname, './rollup/index.js'),
            output: {
                file: path.resolve(__dirname, './out/bundle.js'),
            },
            plugins: [
                RollupShellPlugin({
                    onBeforeBuild: {
                        scripts: [
                            'echo "onBeforeRun"',
                            'sleep 1'
                        ],
                        blocking: true,
                        parallel: false
                    }
                })
            ]
        }).then(() => done()).catch(err => done(err))
    }).not.toThrow()
})
//
it('Check scripts exec', (done) => {
    rollup({
        input: path.resolve(__dirname, './rollup/index.js'),
        output: {
            file: path.resolve(__dirname, './out/bundle.js'),
        },
        plugins: [
            RollupShellPlugin({
                onBuildEnd: {
                    scripts: [
                        'node ./tests/scripts/big_data.js'
                    ],
                    blocking: true,
                    parallel: false
                }
            })
        ]
    }).then(() => done()).catch(err => done(err))
})
//
it('Check scripts exit code', (done) => {
    rollup({
        input: path.resolve(__dirname, './rollup/index.js'),
        output: {
            file: path.resolve(__dirname, './out/bundle.js'),
        },
        plugins: [
            RollupShellPlugin({
                logging: false,
                onBuildEnd: {
                    scripts: [
                        'node ./tests/scripts/exit-code-1.js'
                    ],
                    blocking: true,
                    parallel: false
                }
            })
        ]
    }).then(() => done()).catch(err => done(err))
})

it('Check scripts with file', (done) => {
    rollup({
        input: path.resolve(__dirname, './rollup/index.js'),
        output: {
            file: './tests/out/bundle.js',
        },
        plugins: [
            RollupShellPlugin({
                logging: false,
                onBuildEnd: {
                    scripts: [
                        `echo "test onBuildEnd"`,
                        'node ' + path.resolve(__dirname, './scripts/file.js')
                    ],
                    blocking: true,
                    parallel: false
                }
            })
        ]
    }).then(() => {
        expect(fs.existsSync(path.join(__dirname, './out/test.txt'))).toBe(true)
        done()
    }).catch(err => done(err))

})

it('Check scripts run', (done) => {
    rollup({
        input: path.resolve(__dirname, './rollup/index.js'),
        output: {
            file: path.resolve(__dirname, './out/bundle.js'),
        },
        plugins: [
            RollupShellPlugin({
                onBuildEnd: {
                    scripts: [
                        () => new Promise((resolve, reject) => {
                            const dir = path.join(__dirname, './out');
                            if (!fs.existsSync(dir))fs.mkdirSync(dir);
                            fs.writeFileSync(path.join(__dirname, './out/run.txt'), 'Hey there!')
                            resolve('ok')
                        })
                    ],
                    blocking: true,
                    parallel: false
                }
            })
        ]
    }).then(() => {
        expect(fs.existsSync(path.join(__dirname, './out/run.txt'))).toBe(true)
        done()
    }).catch(err => done(err))

})

describe('testEvents', () => {
    let consoleOutput: Array<string> = []
    const mockedLog = (output: string) => consoleOutput.push(output)
    beforeEach(() => (consoleOutput = []))
    afterEach(() => (consoleOutput = []))

    it('work test', (done) => {
        consoleOutput = []
        rollup({
            input: path.resolve(__dirname, './rollup/index.js'),
            output: {
                file: path.resolve(__dirname, './out/bundle.js'),
            },
            plugins: [
                RollupShellPlugin({
                    onBuildEnd: {
                        scripts: [
                            () => new Promise((resolve, reject) => {
                                mockedLog('test 1')
                                resolve('ok')
                            })
                        ],
                        blocking: true,
                        parallel: false
                    }
                })
            ]
        }).then(() => {
            expect(consoleOutput).toEqual([
                'test 1'
            ])
            done()
        }).catch(err => done(err))
    })

    it('test queue', (done) => {
        consoleOutput = []
        rollup({
            input: path.resolve(__dirname, './rollup/index.js'),
            output: {
                file: path.resolve(__dirname, './out/bundle.js'),
            },
            plugins: [
                RollupShellPlugin({
                    onBeforeNormalRun: () => mockedLog('onBeforeNormalRun'),
                    onBeforeBuild: () => mockedLog('onBeforeBuild'),
                    onBuildStart: () => mockedLog('onBuildStart'),
                    onBuildEnd: () => mockedLog('onBuildEnd'),
                    onBuildError: () => mockedLog('onBuildError'),
                    onWatchRun: () => mockedLog('onWatchRun'),
                    onDoneWatch: () => mockedLog('onDoneWatch'),
                    onAfterDone: () => mockedLog('onAfterDone')
                })
            ]
        }).then(() => {
            setTimeout(() => {
                expect(consoleOutput).toEqual([
                    'onBeforeNormalRun',
                    'onBeforeBuild',
                    'onBuildStart',
                    'onBuildEnd',
                    // 'onAfterDone' // ??
                ])
                done()
            }, 100)
        }).catch(err => done(err))
    })

    it('test single', (done) => {
        let plugin = RollupShellPlugin({
            onBeforeBuild: {
                scripts: [
                    () => new Promise((resolve, reject) => {
                        mockedLog('onBeforeBuild')
                    })
                ],
                blocking: true,
                parallel: false,
                once: true,
            },
        })
        consoleOutput = []
        rollup({
            input: path.resolve(__dirname, './rollup/index.js'),
            output: {
                file: path.resolve(__dirname, './out/bundle.js'),
            },
            plugins: [
                plugin
            ]
        }).then(() => {
        }).catch(err => done(err))
        rollup({
            input: path.resolve(__dirname, './rollup/index.js'),
            output: {
                file: path.resolve(__dirname, './out/bundle.js'),
            },
            plugins: [
                plugin
            ]
        }).then(() => {
        }).catch(err => done(err))
        rollup({
            input: path.resolve(__dirname, './rollup/index.js'),
            output: {
                file: path.resolve(__dirname, './out/bundle.js'),
            },
            plugins: [
                plugin
            ]
        }).then(() => {
        }).catch(err => done(err))

        setTimeout(() => {
            expect(consoleOutput).toEqual([
                'onBeforeBuild',
            ])
            done()
        }, 1000)
    })

    it('test onBeforeBuild', (done) => {
        consoleOutput = []
        rollup({
            input: path.resolve(__dirname, './rollup/index.js'),
            output: {
                file: path.resolve(__dirname, './out/bundle.js'),
            },
            plugins: [
                RollupShellPlugin({
                    onBeforeBuild: () => mockedLog('onBeforeBuild'),
                })
            ]
        }).then(() => {
            expect(consoleOutput).toEqual([
                'onBeforeBuild',
            ])
            done()
        }).catch(err => done(err))
    })
})
