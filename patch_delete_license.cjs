const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `    if (targetTrustName) {
      // 2. Remove all users belonging to this deleted trust`;
const replacement = `    if (targetTrustName) {
      // Delete entirely from Firebase Cloud
      deleteTrustFromFirebase(targetTrustName).catch(e => console.warn(e));
      
      // 2. Remove all users belonging to this deleted trust`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
