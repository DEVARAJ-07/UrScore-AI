const { fork } = require('child_process');
const path = require('path');

const workerPath = path.resolve(__dirname, 'worker/src/index.ts');
const binPath = path.resolve(__dirname, 'backend/node_modules/ts-node/dist/bin.js');

console.log('Spawning test fork...');
const child = fork(
  binPath,
  [
    workerPath,
    'test-scan-id',
    'DEVARAJ-07',
    'Developer',
    '',
    '',
    ''
  ],
  {
    env: {
      ...process.env,
      TS_NODE_PROJECT: path.resolve(__dirname, 'worker/tsconfig.json'),
      TS_NODE_TRANSPILE_ONLY: 'true'
    },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  }
);

child.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

child.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

child.on('message', (msg) => {
  console.log('MESSAGE:', msg);
});

child.on('error', (err) => {
  console.log('ERROR:', err);
});

child.on('exit', (code) => {
  console.log('EXIT:', code);
});
