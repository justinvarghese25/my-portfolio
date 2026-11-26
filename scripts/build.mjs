import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, '_site');
const publicFiles = ['index.html', 'styles.css', 'script.js', 'scenes.js', 'exploration.js', '.nojekyll', 'robots.txt', 'sitemap.xml', 'assets/favicon.svg', 'assets/social-card.png'];
const allowedMedia = new Set(['assets/favicon.svg', 'assets/social-card.png']);

async function audit(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['.git', '_site', 'node_modules'].includes(entry.name)) continue;
    const relative = prefix + entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not allowed: ${relative}`);
    if (entry.isDirectory()) { await audit(resolve(directory, entry.name), relative + '/'); continue; }
    if (/\.(pdf|docx?|pptx?|xlsx?|zip|pem|key)$/i.test(entry.name) || /^\.env(?:\.|$)/i.test(entry.name)) throw new Error(`Private document or secret-like file found: ${relative}`);
    if (/\.(png|jpe?g|webp|svg|gif)$/i.test(entry.name) && !allowedMedia.has(relative)) throw new Error(`Review this media before allowing publication: ${relative}`);
  }
}

await audit(root);
const html = await readFile(resolve(root, 'index.html'), 'utf8');
if (/\/mnt\/data|file:\/\/|raw\.githubusercontent\.com|<script[^>]+src=["']https?:|on(?:click|load)=/i.test(html)) throw new Error('Unsafe or broken legacy reference found.');
for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const reference = match[1];
  if (reference.startsWith('#')) {
    if (!html.includes(`id="${reference.slice(1)}"`)) throw new Error(`Missing anchor: ${reference}`);
  } else if (!/^(https:|mailto:)/.test(reference)) {
    if (!publicFiles.includes(reference)) throw new Error(`Asset missing from publication allowlist: ${reference}`);
    await readFile(resolve(root, reference));
  }
}
// Remove only this fixed build-output directory inside the repository.
await rm(output, { recursive: true, force: true });
for (const file of publicFiles) {
  await mkdir(dirname(resolve(output, file)), { recursive: true });
  await cp(resolve(root, file), resolve(output, file));
}
console.log(`Validated and built ${publicFiles.length} public files into _site/. No private documents included.`);
