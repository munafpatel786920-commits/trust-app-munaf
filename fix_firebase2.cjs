const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

code = code.replace(
    /await withTimeout\(Promise\.all\(\[\s*setDoc\(licRef, \{ list: licenses, updated_at: new Date\(\)\.toISOString\(\) \}, \{ merge: true \}\),\s*setDoc\(userRef, \{ list: users, updated_at: new Date\(\)\.toISOString\(\) \}, \{ merge: true \}\)\s*\]\), 4000\);/g,
    `const cleanLicenses = JSON.parse(JSON.stringify(licenses));
    const cleanUsers = JSON.parse(JSON.stringify(users));

    await withTimeout(Promise.all([
      setDoc(licRef, { list: cleanLicenses, updated_at: new Date().toISOString() }, { merge: true }),
      setDoc(userRef, { list: cleanUsers, updated_at: new Date().toISOString() }, { merge: true })
    ]), 4000);`
);

fs.writeFileSync('src/lib/firebase.ts', code);
