import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const assets = [
  ['src/db/schema.sql', 'dist/db/schema.sql'],
];

for (const [source, target] of assets) {
  const targetPath = resolve(target);
  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(resolve(source), targetPath);
}
