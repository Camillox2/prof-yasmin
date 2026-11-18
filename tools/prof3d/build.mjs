import { build } from 'esbuild';
await build({ entryPoints: ['prof3d-entry.js'], bundle: true, format: 'esm', minify: true, target: 'es2019', outfile: '../../prof3d.js', legalComments: 'eof' });
