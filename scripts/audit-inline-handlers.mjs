import fs from 'node:fs';

const htmlPath = process.argv[2] || 'index.html';
const html = fs.readFileSync(htmlPath, 'utf8');
const handlerAttributes = /\b(?:onclick|oninput|onchange|onsubmit|onblur|onfocus)="([^"]+)"/g;
const functionCalls = /\b([A-Za-z_$][\w$]*)\s*\(/g;

const called = new Set();
for (const match of html.matchAll(handlerAttributes)) {
  for (const call of match[1].matchAll(functionCalls)) {
    called.add(call[1]);
  }
}

const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .join('\n');

const defined = new Set();
for (const match of scripts.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
  defined.add(match[1]);
}
for (const match of scripts.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g)) {
  defined.add(match[1]);
}

const browserGlobals = new Set([
  'Array',
  'Date',
  'FormData',
  'JSON',
  'Math',
  'Number',
  'Object',
  'String',
  'clearTimeout',
  'console',
  'document',
  'fetch',
  'isNaN',
  'localStorage',
  'parseFloat',
  'setTimeout',
  'window'
]);

const propertyCalls = new Set([
  'click',
  'focus',
  'getElementById',
  'reload',
  'scrollIntoView'
]);

const missing = [...called]
  .filter((name) => !defined.has(name))
  .filter((name) => !browserGlobals.has(name))
  .filter((name) => !propertyCalls.has(name))
  .sort();

if (missing.length) {
  console.error('Missing functions referenced by inline handlers:');
  for (const name of missing) console.error(`- ${name}`);
  process.exit(1);
}

console.log('OK inline handlers are backed by defined functions');

