import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, 'dist_electron');
const targetDir = path.join(__dirname, 'dist');

console.log('Finalizing build: Copying Electron executables to final target locations...');

// Create target directory if not exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Map of expected outputs in build output to final paths
const filesToCopy = [
  {
    src: 'TrustAccountingSetup.exe',
    dest: 'TrustAccountingSetup.exe',
    required: true
  },
  {
    src: 'latest.yml',
    dest: 'latest.yml',
    required: false
  }
];

let successCount = 0;
let requiredFilesCount = filesToCopy.filter(f => f.required !== false).length;

for (const item of filesToCopy) {
  const srcPath = path.join(sourceDir, item.src);
  const destPath = path.join(targetDir, item.dest);

  if (fs.existsSync(srcPath)) {
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Successfully copied: ${item.src} -> dist/${item.dest}`);
      if (item.required !== false) {
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Failed to copy ${item.src}:`, err);
    }
  } else {
    if (item.required === false) {
      console.log(`ℹ️ Optional file ${item.src} was not found (skipping).`);
      continue;
    }
    // Check if there is any other EXE matching Setup or Portable in dist_electron
    console.warn(`⚠️ Warning: Expected build artifact ${item.src} was not found at ${srcPath}`);
    // Search for any similar file
    const allFiles = fs.existsSync(sourceDir) ? fs.readdirSync(sourceDir) : [];
    const similar = allFiles.find(f => f.toLowerCase().includes(item.dest.replace('.exe', '').toLowerCase()) && f.endsWith('.exe'));
    if (similar) {
      try {
        fs.copyFileSync(path.join(sourceDir, similar), destPath);
        console.log(`✅ Found alternative and successfully copied: ${similar} -> dist/${item.dest}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to copy alternative ${similar}:`, err);
      }
    } else {
      console.error(`❌ Error: Could not find any executable matching "${item.dest}" in ${sourceDir}`);
    }
  }
}

if (successCount === requiredFilesCount) {
  console.log('🎉 Electron build artifacts placed in dist/ successfully!');
} else {
  console.error('⚠️ Complete packaging checks finished with warnings or errors.');
}
