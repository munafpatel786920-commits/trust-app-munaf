const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/localStorage\.setItem\('trust_users',\s*JSON\.stringify\(cleanedUsersList\)\);/g, "syncStorage('trust_users', cleanedUsersList);");

fs.writeFileSync('src/App.tsx', code);
