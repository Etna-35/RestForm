import fs from 'node:fs';
import vm from 'node:vm';

const htmlPath = process.argv[2] || 'index.html';
const html = fs.readFileSync(htmlPath, 'utf8');
const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1].trim())
  .filter(Boolean);

if (!blocks.length) {
  console.error(`No inline <script> blocks found in ${htmlPath}`);
  process.exit(1);
}

let failed = false;

blocks.forEach((code, index) => {
  try {
    new vm.Script(code, { filename: `${htmlPath}#script-${index + 1}` });
    console.log(`OK script ${index + 1}: ${code.length} chars`);
  } catch (error) {
    failed = true;
    console.error(`Syntax error in script ${index + 1}: ${error.message}`);
  }
});

if (failed) process.exit(1);

