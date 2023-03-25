import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/bundle.js',
        sourcemap: true,
        format: 'esm'
    },
    plugins: [
        typescript(),
    ]
};
