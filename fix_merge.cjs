const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /const merged = mergeList\(([^,]+), ([^)]+)\);\s*set([A-Za-z]+)\(merged\);\s*localStorage\.setItem\(([^,]+), JSON\.stringify\(merged\)\);/g;

code = code.replace(regex, (match, localList, cloudList, setterName, keyName) => {
    return `set${setterName}(prev => {
          const merged = mergeList(prev, ${cloudList});
          localStorage.setItem(${keyName}, JSON.stringify(merged));
          return merged;
        });`;
});

fs.writeFileSync('src/App.tsx', code);
