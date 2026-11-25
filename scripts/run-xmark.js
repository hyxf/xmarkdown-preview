import { spawn } from 'node:child_process';
import console from 'node:console';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const codeCli = process.env.VSCODE_CLI || 'code';

const run = (command, args, options = {}) =>
  new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      ...options,
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${command} exited with ${signal ?? code}`));
      }
    });
  });

try {
  await run('pnpm', ['run', 'build']);
  await run(codeCli, ['--new-window', `--extensionDevelopmentPath=${root}`]);
} catch (error) {
  console.error(
    `[xMark] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
