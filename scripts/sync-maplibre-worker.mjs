/**
 * Copies MapLibre's worker bundle into `public/maplibre/` so the browser can
 * load it from our own origin.
 *
 * MapLibre finds its worker with `new URL('./maplibre-gl-worker.mjs',
 * import.meta.url)` and gives up — returning an empty URL — when
 * `import.meta.url` is not http(s). Under Next's bundler it never is, so the
 * worker silently fails to start: raster tiles still draw (main thread) but
 * every GeoJSON layer stays invisible, because GeoJSON is parsed in the
 * worker. `ServiceAreaMap` points `setWorkerUrl` at the copy this script
 * writes.
 *
 * Copied at dev/build time rather than committed, so the files can never
 * drift from the installed version of the package.
 */
import { createRequire } from 'node:module';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// The worker imports './maplibre-gl-shared.mjs' by relative path, so its
// sibling has to travel with it.
const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve('maplibre-gl/dist/maplibre-gl.mjs'));
const target = join(process.cwd(), 'public', 'maplibre');

await mkdir(target, { recursive: true });
await Promise.all(
  FILES.map((file) => copyFile(join(dist, file), join(target, file))),
);

console.log(`maplibre worker synced to public/maplibre (${FILES.join(', ')})`);
