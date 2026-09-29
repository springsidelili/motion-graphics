// Runs a Python tool with whichever Python 3 this machine has (python3, python or
// the Windows `py` launcher; set PYTHON to choose one), so npm scripts work in any shell.
//   npx tsx scripts/py.ts tools/audio.py [args]
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Command (+ leading args) that starts Python 3, or null. */
export function findPython(): string[] | null {
  const tries = [
    ...(process.env.PYTHON ? [[process.env.PYTHON]] : []),
    ...(process.platform === 'win32' ? [['py', '-3'], ['python'], ['python3']] : [['python3'], ['python']]),
  ];
  for (const [cmd, ...pre] of tries) {
    const r = spawnSync(cmd!, [...pre, '-c', 'import sys; print(sys.version_info[0])'], { encoding: 'utf8', timeout: 20000 });
    if (r.status === 0 && r.stdout.trim() === '3') return [cmd!, ...pre];
  }
  return null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const py = findPython();
  if (!py) {
    console.error('Python 3 not found. Install it (python.org) and run `pip install -r requirements.txt`, or set PYTHON to its path.');
    process.exit(1);
  }
  const [script, ...args] = process.argv.slice(2);
  const r = spawnSync(py[0]!, [...py.slice(1), path.resolve(ROOT, script!), ...args], { stdio: 'inherit', cwd: ROOT });
  process.exit(r.status ?? 1);
}
