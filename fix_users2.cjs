const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

function replaceContext(code, searchPattern, replacement) {
    if(code.match(searchPattern)) {
        return code.replace(searchPattern, replacement);
    }
    console.log("Failed to match", searchPattern);
    return code;
}

code = code.replace(/localStorage\.setItem\('trust_users',\s*JSON\.stringify\(updatedUsers\)\);/g, "syncStorage('trust_users', updatedUsers);");
code = code.replace(/localStorage\.setItem\('trust_users',\s*JSON\.stringify\(updated\)\);/g, "syncStorage('trust_users', updated);");
code = code.replace(/localStorage\.setItem\('trust_users',\s*JSON\.stringify\(curUsers\)\);/g, "syncStorage('trust_users', curUsers);");

fs.writeFileSync('src/App.tsx', code);
