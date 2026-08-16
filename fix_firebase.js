const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const regex = /const docRef = doc\(db, 'trust_records', docId\);\s*await withTimeout\(setDoc\(docRef, \{\s*\[datasetKey\]: data,/g;

code = code.replace(regex, `const docRef = doc(db, 'trust_records', docId);

    // Strip undefined values which Firebase does not support
    const cleanData = JSON.parse(JSON.stringify(data));

    await withTimeout(setDoc(docRef, {
      [datasetKey]: cleanData,`);

fs.writeFileSync('src/lib/firebase.ts', code);
