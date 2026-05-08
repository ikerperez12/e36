/**
 * Genera posters JPG y un OG image a partir de los .mp4.
 * Requiere: ffmpeg-static (ya en devDependencies).
 *
 * Uso: npm run build:posters
 *
 * Salidas:
 *   assets/posters/01.jpg ... 07.jpg  (540px de ancho, q=4)
 *   assets/og-image.jpg                (1200×630, generada de videos/02.mp4)
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegStatic from 'ffmpeg-static';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const VIDEOS = resolve(ROOT, 'videos');
const POSTERS = resolve(ROOT, 'assets/posters');
const OG_OUT = resolve(ROOT, 'assets/og-image.jpg');

if (!existsSync(POSTERS)) mkdirSync(POSTERS, { recursive: true });

const slugs = ['01', '02', '03', '04', '05', '06', '07'];

for (const slug of slugs) {
  const input = resolve(VIDEOS, `${slug}.mp4`);
  const output = resolve(POSTERS, `${slug}.jpg`);
  if (!existsSync(input)) {
    console.warn(`[skip] missing ${input}`);
    continue;
  }
  execFileSync(
    ffmpegStatic,
    ['-y', '-ss', '0.3', '-i', input, '-frames:v', '1', '-update', '1', '-q:v', '4', '-vf', 'scale=540:-1', output],
    { stdio: 'inherit' }
  );
  console.log(`✓ ${slug}.jpg`);
}

execFileSync(
  ffmpegStatic,
  [
    '-y', '-ss', '0.5',
    '-i', resolve(VIDEOS, '02.mp4'),
    '-frames:v', '1',
    '-vf', 'scale=1200:-1,crop=1200:630,eq=contrast=1.05:brightness=-0.05',
    '-update', '1',
    '-q:v', '3',
    OG_OUT
  ],
  { stdio: 'inherit' }
);
console.log('✓ og-image.jpg');
