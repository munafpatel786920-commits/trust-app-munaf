const fs = require('fs');
let code = fs.readFileSync('src/components/AccountingModule.tsx', 'utf-8');
const backup = fs.readFileSync('balance_sheet.txt', 'utf-8');

const startMarker = '{/* Schedule VIII Balance Sheet Tally Prime Style */}';
const endMarker = '{/* Audit Certificate & Signatures */}';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found!");
    process.exit(1);
}

const prefix = code.substring(0, startIndex);
const suffix = code.substring(endIndex);

let fixBackup = backup.replace('totalCapitalFundBalance', 'totalLiabilities');

const newCode = prefix + '{/* Schedule VIII Balance Sheet T-Ledger Grid */}\n' + fixBackup + '\n          ' + suffix;

fs.writeFileSync('src/components/AccountingModule.tsx', newCode);
console.log("Reverted!");
