import { copyFile, mkdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await Promise.all(['index.html', 'styles.css'].map((file) => copyFile(file, `dist/${file}`)));
