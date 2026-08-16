const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
    /uName === cleanUser && \(uPass === cleanPass \|\| uPass\.toLowerCase\(\) === cleanPass\.toLowerCase\(\) \|\| uPass === ''\)/g,
    "uName === cleanUser && (uPass === cleanPass || uPass.toLowerCase() === cleanPass.toLowerCase())"
);

fs.writeFileSync('src/App.tsx', code);
