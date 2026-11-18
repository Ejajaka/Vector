import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(appDir, '../../docs/models/bert_tagger');
const target = resolve(appDir, 'public/models/bert_tagger');

if (existsSync(target)) {
  console.log('Models already present in public/models, skipping copy.');
  process.exit(0);
}

if (!existsSync(source)) {
  console.error(
    'Could not find docs/models/bert_tagger. The repository checkout must include docs/models.',
  );
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
cpSync(source, target, { recursive: true });
console.log('Seeded public/models/bert_tagger from docs/models.');
