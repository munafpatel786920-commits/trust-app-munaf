const fs = require('fs');
let code = fs.readFileSync('src/components/AccountingModule.tsx', 'utf-8');

code = code.replace(/<span>Capital Account<\/span>/g, '<span>Capital Account (મૂડી ખાતું)</span>');
code = code.replace(/<span>Opening Balance<\/span>/g, '<span>Opening Balance (શરૂઆતની બાકી)</span>');
code = code.replace(/<span>Add: Opening Stock<\/span>/g, '<span>Add: Opening Stock (શરૂઆતનો સ્ટોક)</span>');
code = code.replace(/<span>Add: Current Year Surplus<\/span>/g, '<span>Add: Current Year Surplus (ચાલુ વર્ષનો વધારો)</span>');
code = code.replace(/<span>Stock Adjustments<\/span>/g, '<span>Stock Adjustments (સ્ટોક સુધારો)</span>');
code = code.replace(/<span>Fixed Assets<\/span>/g, '<span>Fixed Assets (સ્થાયી મિલકતો)</span>');
code = code.replace(/<span>Current Assets<\/span>/g, '<span>Current Assets (ચાલુ મિલકતો)</span>');
code = code.replace(/<span>Closing Stock<\/span>/g, '<span>Closing Stock (આખર સ્ટોક)</span>');
code = code.replace(/<span>Bank Accounts<\/span>/g, '<span>Bank Accounts (બેંક ખાતાઓ)</span>');
code = code.replace(/<span>Cash-in-Hand<\/span>/g, '<span>Cash-in-Hand (રોકડ સિલક)</span>');
code = code.replace(/<span>Cash<\/span>/g, '<span>Cash (રોકડ)</span>');
code = code.replace(/<span>Liabilities<\/span>/g, '<span>Liabilities (જવાબદારીઓ)</span>');
code = code.replace(/<span>Assets<\/span>/g, '<span>Assets (મિલકતો)</span>');
code = code.replace(/<span>Amount<\/span>/g, '<span>Amount (રકમ)</span>');
code = code.replace(/Balance Sheet<br\/>/g, 'Balance Sheet (પાકું સરવૈયું)<br/>');

fs.writeFileSync('src/components/AccountingModule.tsx', code);
