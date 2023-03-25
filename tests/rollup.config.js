import RollupShellPlugin from '../dist/bundle'
import path from "path";
import fs from "fs";

export default [
    {
        input: path.resolve(__dirname, './rollup/index.js'),
        output: {
            file: path.resolve(__dirname, './out/bundle.js'),
        },
        plugins: [
            RollupShellPlugin({
                onBeforeNormalRun: () => console.log('onBeforeNormalRun'),
                onBeforeBuild: () => console.log('onBeforeBuild'),
                onBuildStart: () => console.log('onBuildStart'),
                onBuildEnd: () => console.log('onBuildEnd'),
                onBuildError: () => console.log('onBuildError'),
                onWatchRun: () => console.log('onWatchRun'),
                onDoneWatch: () => console.log('onDoneWatch'),
                onAfterDone: () => console.log('onAfterDone'),
                // onBeforeBuild: {
                //     scripts: [
                //         'node ./tests/scripts/big_data.js',
                //         'node ./tests/scripts/file.js',
                //         `echo "test onBuildStart"`,
                //         'echo "Building ..."'
                //     ]
                // },
                // onBuildEnd: {
                //     scripts: [
                //         () => new Promise((resolve, reject) => {
                //             const dir = path.join(__dirname, './out');
                //             if (!fs.existsSync(dir))fs.mkdirSync(dir);
                //             fs.writeFileSync(path.join(__dirname, './out/run.txt'), 'Hey there!')
                //             console.log(1111, 2222, 33333)
                //             resolve('ok')
                //         })
                //     ],
                //     blocking: true,
                //     parallel: false
                // },
                dev: false,
                safe: false,
                logging: false
            }),
        ]
    },
    // {
    //     input: path.resolve(__dirname, './rollup/exit-code-1.js'),
    //     output: {
    //         file: path.resolve(__dirname, './out/bundle.js'),
    //     },
    //     plugins: [
    //         RollupShellPlugin({
    //             onBeforeBuild: {
    //                 scripts: [
    //                     `echo "test onBeforeBuild"`,
    //                     'echo "Building ..."'
    //                 ]
    //             },
    //             dev: false,
    //             safe: false,
    //             logging: true
    //         })
    //     ]
    // }
]
