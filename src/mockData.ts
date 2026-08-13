/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Donor, IncomeReceipt, ExpenseVoucher, TrustMember, BankAccount, Asset, DocumentMeta, AuditLog, TrustLicense, TrustSettings, AgendaTharav, MemberSharePurchase, MemberLoanApplication } from './types';

export const DEFAULT_USERS: User[] = [
  {
    id: 'usr1',
    username: 'admin',
    nameGuj: 'રમણલાલ શાહ (ટ્રસ્ટી)',
    role: 'Admin',
    roleGuj: 'પ્રશાસક (Administrator)',
    passwordHash: 'admin123',
    isActive: true,
    trustNameGuj: 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ'
  },
  {
    id: 'usr2',
    username: 'accountant',
    nameGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)',
    role: 'Accountant',
    roleGuj: 'નામું રાખનાર (Accountant)',
    passwordHash: 'acc123',
    isActive: true,
    trustNameGuj: 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ'
  },
  {
    id: 'usr3',
    username: 'operator',
    nameGuj: 'પરેશ પટેલ (ડેટા એન્ટ્રી)',
    role: 'DataEntry',
    roleGuj: 'ડેટા એન્ટ્રી ઓપરેટર (Data Entry)',
    passwordHash: 'op123',
    isActive: true,
    trustNameGuj: 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ'
  },
  {
    id: 'usr4',
    username: 'readonly',
    nameGuj: 'જયેશભાઈ વ્યાસ (નિરીક્ષક)',
    role: 'ReadOnly',
    roleGuj: 'માત્ર વાંચવા માટે (Read Only)',
    passwordHash: 'read123',
    isActive: true,
    trustNameGuj: 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ'
  }
];

export const DEFAULT_DONORS: Donor[] = [
  {
    id: 'dnr1',
    nameGuj: 'ચિંતન રજનીકાંત પટેલ',
    phone: '9825012345',
    addressGuj: '૨૪, સુખશાંતિ સોસાયટી, સેટેલાઇટ, અમદાવાદ',
    panNumber: 'ABCDE1234F',
    aadharNumber: '123456789012',
    email: 'chintan@gmail.com',
    createdAt: '2026-01-10T11:00:00Z'
  },
  {
    id: 'dnr2',
    nameGuj: 'મંગળાબેન કેશવલાલ મોદી',
    phone: '9426098765',
    addressGuj: '૧૨/એ, લક્ષ્મીકૃપા ફ્લેટ્સ, નવરંગપુરા, અમદાવાદ',
    panNumber: 'WXYZR9876Q',
    aadharNumber: '987654321098',
    email: 'mangla@yahoo.com',
    createdAt: '2026-01-15T14:30:00Z'
  },
  {
    id: 'dnr3',
    nameGuj: 'હસમુખલાલ શાહ એન્ડ સન્સ (હાર્દિકભાઈ)',
    phone: '9909012233',
    addressGuj: '૪૦૧, શિખર કોમ્પ્લેક્સ, આશ્રમ રોડ, અમદાવાદ',
    panNumber: 'AACHH8877K',
    aadharNumber: '556677889900',
    email: 'hardik@shahandco.com',
    createdAt: '2026-02-01T10:15:00Z'
  },
  {
    id: 'dnr4',
    nameGuj: 'જમનાદાસ કાલીદાસ મહેતા (ટ્રસ્ટ ફંડ)',
    phone: '9173044556',
    addressGuj: '૫૫, કૃષ્ણનગર સોસાયટી, કારેલીબાગ, વડોદરા',
    panNumber: 'PPMMD1122J',
    aadharNumber: '334455667788',
    email: 'jamnadas_m@gmail.com',
    createdAt: '2026-03-12T16:00:00Z'
  }
];

export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [];

export const DEFAULT_INCOME_RECEIPTS: IncomeReceipt[] = [
  {
    id: 'rcp1',
    receiptNumber: 'TR-2026-0001',
    date: '2026-07-15',
    donorId: 'dnr1',
    donorNameGuj: 'ચિંતન રજનીકાંત પટેલ',
    category: 'દાન (Donation)',
    amount: 51000,
    paymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    bankId: 'bnk1',
    remarksGuj: 'સામાન્ય ફંડમાં સ્વેચ્છિક દાન, 80G પાવતી',
    operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
  },
  {
    id: 'rcp2',
    receiptNumber: 'TR-2026-0002',
    date: '2026-07-20',
    donorId: 'dnr2',
    donorNameGuj: 'મંગળાબેન કેશવલાલ મોદી',
    category: 'ઝકાત (Zakat)',
    amount: 25000,
    paymentMode: 'રોકડ (Cash)',
    remarksGuj: 'ગરીબ અને જરૂરિયાતમંદ કલ્યાણ પ્રવૃત્તિ માટે',
    operatorGuj: 'પરેશ પટેલ (ડેટા એન્ટ્રી)'
  },
  {
    id: 'rcp3',
    receiptNumber: 'TR-2026-0003',
    date: '2026-07-22',
    donorId: 'dnr3',
    donorNameGuj: 'હસમુખલાલ શાહ એન્ડ સન્સ (હાર્દિકભાઈ)',
    category: 'ભાડાની આવક (Rental Income)',
    amount: 15000,
    paymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    bankId: 'bnk2',
    remarksGuj: 'દુકાન નં. ૫ નું માસિક ભાડું - જુલાઈ ૨૦૨૬',
    operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
  },
  {
    id: 'rcp4',
    receiptNumber: 'TR-2026-0004',
    date: '2026-07-25',
    donorId: 'dnr4',
    donorNameGuj: 'જમનાદાસ કાલીદાસ મહેતા (ટ્રસ્ટ ફંડ)',
    category: 'સદકા (Sadqa)',
    amount: 10000,
    paymentMode: 'ચેક (Cheque)',
    bankId: 'bnk1',
    chequeNumber: '990123',
    remarksGuj: 'આરોગ્ય અને દવા વિતરણ સહાય કાર્યક્રમ',
    operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
  },
  {
    id: 'rcp5',
    receiptNumber: 'TR-2026-0728',
    date: '2026-07-28',
    donorId: 'dnr1',
    donorNameGuj: 'ચિંતન રજનીકાંત પટેલ',
    category: 'ફિતરા (Fitra)',
    amount: 5000,
    paymentMode: 'રોકડ (Cash)',
    remarksGuj: 'રમઝાન ફિતરા ફંડ વિતરણ અર્થે',
    operatorGuj: 'પરેશ પટેલ (ડેટા એન્ટ્રી)'
  },
  {
    id: 'rcp-fee-1',
    receiptNumber: 'FEE-2025-001',
    date: '2025-01-15',
    donorId: 'mbr1',
    donorNameGuj: 'રમણલાલ કાંતિલાલ શાહ',
    category: 'સભાસદ પ્રવેશ ફી (Membership Fee)',
    amount: 500,
    paymentMode: 'રોકડ (Cash)',
    remarksGuj: 'સભાસદ નં. M-101 પ્રવેશ ફી આવક',
    operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
  },
  {
    id: 'rcp-share-1',
    receiptNumber: 'CERT-2025-01',
    date: '2025-01-15',
    donorId: 'mbr1',
    donorNameGuj: 'રમણલાલ કાંતિલાલ શાહ',
    category: 'સભાસદ શેર મૂડી (Member Share Capital)',
    amount: 1000,
    paymentMode: 'રોકડ (Cash)',
    remarksGuj: 'સભાસદ નં. M-101 શેર ભાંડોળ આવક (10 શેર)',
    operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
  },
  {
    id: 'rcp-fee-2',
    receiptNumber: 'FEE-2025-002',
    date: '2025-03-20',
    donorId: 'mbr2',
    donorNameGuj: 'સુરેશચંદ્ર બળવંતરાય મહેતા',
    category: 'સભાસદ પ્રવેશ ફી (Membership Fee)',
    amount: 500,
    paymentMode: 'રોકડ (Cash)',
    remarksGuj: 'સભાસદ નં. M-102 પ્રવેશ ફી આવક',
    operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
  },
  {
    id: 'rcp-share-2',
    receiptNumber: 'CERT-2025-02',
    date: '2025-03-20',
    donorId: 'mbr2',
    donorNameGuj: 'સુરેશચંદ્ર બળવંતરાય મહેતા',
    category: 'સભાસદ શેર મૂડી (Member Share Capital)',
    amount: 2500,
    paymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    bankId: 'bnk1',
    remarksGuj: 'સભાસદ નં. M-102 શેર મૂડી (25 શેર)',
    operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
  }
];

export const DEFAULT_EXPENSE_VOUCHERS: ExpenseVoucher[] = [
  {
    id: 'vch1',
    voucherNumber: 'EX-2026-0001',
    date: '2026-07-16',
    category: 'પગાર (Salary)',
    amount: 18000,
    paidToGuj: 'રાજેશભાઈ વી. સોલંકી',
    paymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    bankId: 'bnk1',
    remarksGuj: 'ઓફિસ આસિસ્ટન્ટ માસિક પગાર - જુલાઈ ૨૦૨૬',
    approvedByGuj: 'રમણલાલ શાહ (ટ્રસ્ટી)',
    operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
  },
  {
    id: 'vch2',
    voucherNumber: 'EX-2026-0002',
    date: '2026-07-18',
    category: 'વીજળી બિલ (Electricity)',
    amount: 4500,
    paidToGuj: 'ટોરેન્ટ પાવર લિમિટેડ અમદાવાદ',
    paymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    bankId: 'bnk1',
    remarksGuj: 'ટ્રસ્ટ ભવન મેઇન મીટર બિલ જુલાઈ ૨૦૨૬',
    approvedByGuj: 'રમણલાલ શાહ (ટ્રસ્ટી)',
    operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
  },
  {
    id: 'vch3',
    voucherNumber: 'EX-2026-0003',
    date: '2026-07-21',
    category: 'ઓફિસ ખર્ચ (Office)',
    amount: 1250,
    paidToGuj: 'અક્ષર સ્ટેશનરી માર્ટ',
    paymentMode: 'રોકડ (Cash)',
    remarksGuj: 'સ્ટેશનરી, પ્રિન્ટિંગ પેપર અને પરચૂરણ ઓફિસ સમાન',
    approvedByGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)',
    operatorGuj: 'પરેશ પટેલ (ડેટા એન્ટ્રી)'
  },
  {
    id: 'vch4',
    voucherNumber: 'EX-2026-0004',
    date: '2026-07-26',
    category: 'મેન્ટેનન્સ (Maintenance)',
    amount: 6000,
    paidToGuj: 'અક્ષર ઇલેક્ટ્રિકલ્સ એન્ડ વાયરિંગ',
    paymentMode: 'રોકડ (Cash)',
    remarksGuj: 'સેકન્ડ ફ્લોર એસી સર્વિસિંગ અને વાયરિંગ રિપેરિંગ',
    approvedByGuj: 'રમણલાલ શાહ (ટ્રસ્ટી)',
    operatorGuj: 'પરેશ પટેલ (ડેટા એન્ટ્રી)'
  },
  {
    id: 'vch5',
    voucherNumber: 'EX-2026-0005',
    date: '2026-07-29',
    category: 'સભાસદ બેંક લોન EMI (Bank EMI Payment)',
    amount: 15000,
    paidToGuj: 'ગુજરાત સ્ટેટ કો-ઓપરેટિવ બેંક (અમદાવાદ શાખા)',
    paymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    bankId: 'bnk1',
    remarksGuj: 'સભાસદ ચિંતન પટેલ બેંક લોન માસિક EMI હપ્તો બેંકમાં જમા કર્યો',
    approvedByGuj: 'રમણલાલ શાહ (ટ્રસ્ટી)',
    operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
  },
  {
    id: 'vch6',
    voucherNumber: 'EX-2026-0006',
    date: '2026-08-01',
    category: 'સભાસદ બેંક લોન EMI (Bank EMI Payment)',
    amount: 12000,
    paidToGuj: 'બેંક ઓફ બરોડા (સરખેજ બ્રાન્ચ)',
    paymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    bankId: 'bnk2',
    remarksGuj: 'સભાસદ સુરેશચંદ્ર મહેતા નો બેંક લોન EMI હપ્તો ચુકવ્યો',
    approvedByGuj: 'રમણલાલ શાહ (ટ્રસ્ટી)',
    operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
  }
];

export const DEFAULT_MEMBERS: TrustMember[] = [
  {
    id: 'mbr1',
    memberNo: 'S-001',
    nameGuj: 'રમણલાલ કાંતિલાલ શાહ',
    memberCategory: 'સભાસદ (Society Member)',
    roleGuj: 'સભાસદ / શેરહોલ્ડર (Member / Shareholder)',
    phone: '9824098901',
    email: 'ramanlal.shah@gmail.com',
    addressGuj: '૪૫, હરિકૃષ્ણ સોસાયટી, મેમનગર, અમદાવાદ',
    joiningDate: '2020-04-01',
    membershipFee: 500,
    feePaymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    feePaymentStatus: 'ચૂકવેલ (Paid)',
    feeReceiptNumber: 'FEE-2025-001',
    feePaymentDate: '2020-04-01',
    folioNumber: 'FOLIO-001',
    shareCount: 10,
    sharePrice: 100,
    totalShareAmount: 1000,
    shareCertificateNo: 'CERT-2025-01'
  },
  {
    id: 'mbr2',
    memberNo: 'S-002',
    nameGuj: 'સુરેશચંદ્ર બળવંતરાય મહેતા',
    memberCategory: 'સભાસદ (Society Member)',
    roleGuj: 'સભાસદ / શેરહોલ્ડર (Member / Shareholder)',
    phone: '9425012399',
    email: 'sureshbmehta@outlook.com',
    addressGuj: '૬-બી, કૈલાસ ધામ સોસાયટી, બાપુનગર, અમદાવાદ',
    joiningDate: '2020-04-01',
    membershipFee: 500,
    feePaymentMode: 'રોકડ (Cash)',
    feePaymentStatus: 'ચૂકવેલ (Paid)',
    feeReceiptNumber: 'FEE-2025-002',
    feePaymentDate: '2020-04-01',
    folioNumber: 'FOLIO-002',
    shareCount: 25,
    sharePrice: 100,
    totalShareAmount: 2500,
    shareCertificateNo: 'CERT-2025-02'
  },
  {
    id: 'mbr5',
    memberNo: 'S-003',
    nameGuj: 'મહેશભાઈ ગોવિંદભાઈ પટેલ',
    memberCategory: 'સભાસદ (Society Member)',
    roleGuj: 'સાધારણ સભાસદ (Ordinary Member)',
    phone: '9898012345',
    email: 'mahesh.patel@gmail.com',
    addressGuj: '૧૨, સર્વોદય સોસાયટી, નારણપુરા, અમદાવાદ',
    joiningDate: '2021-06-10',
    membershipFee: 500,
    feePaymentMode: 'રોકડ (Cash)',
    feePaymentStatus: 'ચૂકવેલ (Paid)',
    feeReceiptNumber: 'FEE-2021-008',
    feePaymentDate: '2021-06-10',
    folioNumber: 'FOLIO-003',
    shareCount: 15,
    sharePrice: 100,
    totalShareAmount: 1500,
    shareCertificateNo: 'CERT-2021-03'
  },
  {
    id: 'mbr-trust-1',
    memberNo: 'T-001',
    nameGuj: 'જિજ્ઞેશભાઈ પરસોત્તમદાસ પટેલ',
    memberCategory: 'ટ્રસ્ટ હોદ્દેદાર / કમિટી સભ્ય (Trustee / Board Member)',
    roleGuj: 'પ્રમુખશ્રી (President)',
    phone: '9879011223',
    email: 'jigneshtrustee@gujtrust.org',
    addressGuj: '૧૦૧, આસ્થા બંગલોઝ, સેટેલાઇટ, અમદાવાદ',
    joiningDate: '2018-01-15',
    membershipFee: 1000,
    feePaymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    feePaymentStatus: 'ચૂકવેલ (Paid)',
    feeReceiptNumber: 'FEE-2018-001',
    feePaymentDate: '2018-01-15'
  },
  {
    id: 'mbr-trust-2',
    memberNo: 'T-002',
    nameGuj: 'રમેશચંદ્ર મનસુખલાલ દેસાઈ',
    memberCategory: 'ટ્રસ્ટ હોદ્દેદાર / કમિટી સભ્ય (Trustee / Board Member)',
    roleGuj: 'મંત્રી / સેક્રેટરી (Secretary)',
    phone: '9825044556',
    email: 'ramesh.desai@gujtrust.org',
    addressGuj: '૫૫, શારદા સોસાયટી, પાલડી, અમદાવાદ',
    joiningDate: '2018-01-15',
    membershipFee: 1000,
    feePaymentMode: 'ચેક (Cheque)',
    feePaymentStatus: 'ચૂકવેલ (Paid)',
    feeReceiptNumber: 'FEE-2018-002',
    feePaymentDate: '2018-01-15'
  },
  {
    id: 'mbr3',
    memberNo: 'M-003',
    nameGuj: 'મનીષ ચીમનલાલ મહેતા',
    memberCategory: 'કર્મચારી / અન્ય (Staff / Volunteer)',
    roleGuj: 'કર્મચારી (Employee)',
    phone: '9904051515',
    email: 'manish_m@gujtrust.org',
    addressGuj: '૧૦૨, તુલસી બંગલોઝ, એલિસબ્રિજ, અમદાવાદ',
    joiningDate: '2022-05-15',
    membershipFee: 100,
    feePaymentMode: 'રોકડ (Cash)',
    feePaymentStatus: 'ચૂકવેલ (Paid)',
    feeReceiptNumber: 'FEE-2022-015',
    feePaymentDate: '2022-05-15'
  },
  {
    id: 'mbr4',
    memberNo: 'M-004',
    nameGuj: 'પ્રવીણભાઈ નરોત્તમ વ્યાસ',
    memberCategory: 'કર્મચારી / અન્ય (Staff / Volunteer)',
    roleGuj: 'સ્વયંસેવક (Volunteer)',
    phone: '9173099881',
    email: 'pravin_vyas@hotmail.com',
    addressGuj: '૧૫, અંબાજી સોસાયટી, વાડજ, અમદાવાદ',
    joiningDate: '2024-01-01',
    membershipFee: 100,
    feePaymentMode: 'રોકડ (Cash)',
    feePaymentStatus: 'ચૂકવેલ (Paid)',
    feeReceiptNumber: 'FEE-2024-001',
    feePaymentDate: '2024-01-01'
  }
];

export const DEFAULT_SHARE_PURCHASES: MemberSharePurchase[] = [
  {
    id: 'shp-101',
    memberId: 'mbr1',
    memberNameGuj: 'રમણલાલ કાંતિલાલ શાહ',
    folioNumber: 'FOLIO-001',
    certificateNo: 'CERT-2025-01',
    date: '2025-04-10',
    shareCount: 10,
    sharePrice: 100,
    totalAmount: 1000,
    paymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    remarksGuj: 'પ્રારંભિક શેર મૂડી ફાળવણી'
  },
  {
    id: 'shp-102',
    memberId: 'mbr2',
    memberNameGuj: 'સુરેશચંદ્ર બળવંતરાય મહેતા',
    folioNumber: 'FOLIO-002',
    certificateNo: 'CERT-2025-02',
    date: '2025-05-15',
    shareCount: 25,
    sharePrice: 100,
    totalAmount: 2500,
    paymentMode: 'રોકડ (Cash)',
    remarksGuj: 'નવા શેર ખરીદી નોંધ'
  }
];

export const DEFAULT_LOAN_APPLICATIONS: MemberLoanApplication[] = [
  {
    id: 'ln-101',
    applicationNo: 'LN-2026-001',
    date: '2026-06-10',
    memberId: 'mbr1',
    memberNameGuj: 'રમણલાલ કાંતિલાલ શાહ',
    memberNo: 'M-101',
    folioNumber: 'FOLIO-101',
    bankNameGuj: 'ધી સુરત ડિસ્ટ્રિક્ટ કો-ઓપરેટિવ બેંક લી.',
    branchGuj: 'મુખ્ય શાખા, સુરત',
    loanTypeGuj: 'ખેતી વિષયક ધિરાણ (Agricultural Loan)',
    requestedAmount: 150000,
    recommendedAmount: 150000,
    purposeGuj: 'મોસમ પાક ધિરાણ અને ખેતી સાધનો ખરીદી અર્થે',
    guarantor1NameGuj: 'સુરેશચંદ્ર બળવંતરાય મહેતા',
    guarantor2NameGuj: 'મનીષ ચીમનલાલ મહેતા',
    statusGuj: 'ભલામણ મંજૂર / NOC ઇશ્યુ (Recommended & NOC Issued)',
    recommendationLetterNo: 'NOC-2026-015',
    approvalDate: '2026-06-12',
    remarksGuj: 'કારોબારી સમિતિ ઠરાવ ક્રમાંક ૪/૨૦૨૬ મુજબ બેંક ધિરાણ ભલામણ પત્રક મંજૂર કરેલ છે.'
  },
  {
    id: 'ln-102',
    applicationNo: 'LN-2026-002',
    date: '2026-01-15',
    memberId: 'mbr2',
    memberNameGuj: 'સુરેશચંદ્ર બળવંતરાય મહેતા',
    memberNo: 'M-102',
    folioNumber: 'FOLIO-102',
    bankNameGuj: 'ધી ગુજરાત સ્ટેટ કો-ઓપરેટિવ બેંક લી.',
    branchGuj: 'નવસારી શાખા',
    loanTypeGuj: 'પશુપાલન / ડેરી ધિરાણ (Cattle/Dairy Loan)',
    requestedAmount: 100000,
    recommendedAmount: 100000,
    purposeGuj: 'દુધાળા પશુઓ ખરીદી અને ડેરી ફાર્મ સુધારણા અર્થે',
    guarantor1NameGuj: 'રમણલાલ કાંતિલાલ શાહ',
    guarantor2NameGuj: 'મનીષ ચીમનલાલ મહેતા',
    statusGuj: 'બેંક દ્વારા લોન મંજૂર અને ચુકવણી થયેલ (Sanctioned & Disbursed)',
    recommendationLetterNo: 'NOC-2026-008',
    approvalDate: '2026-01-18',
    remarksGuj: 'બેંક દ્વારા લોન મંજૂર થઈ સભાસદના બેંક ખાતામાં જમા કરવામાં આવેલ છે.',
    sanctionedAmount: 100000,
    sanctionLetterNo: 'SNC/GSCB/2026/884',
    disbursementDate: '2026-01-20',
    disbursementMode: 'બેંક ખાતામાં જમા (Bank Transfer)',
    chequeOrRefNo: 'UTR-98214452109',
    interestRate: 8.5,
    tenureMonths: 12,
    monthlyInstallmentAmount: 8715,
    repayments: [
      {
        id: 'rpm-1',
        loanId: 'ln-102',
        installmentNo: 1,
        date: '2026-02-20',
        principalPaid: 8000,
        interestPaid: 715,
        totalPaid: 8715,
        receiptNumber: 'LRCP-2026-001',
        paymentMode: 'રોકડ (Cash)',
        remarksGuj: 'પ્રથમ હપ્તો જમા',
        operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
      },
      {
        id: 'rpm-2',
        loanId: 'ln-102',
        installmentNo: 2,
        date: '2026-03-20',
        principalPaid: 8060,
        interestPaid: 655,
        totalPaid: 8715,
        receiptNumber: 'LRCP-2026-024',
        paymentMode: 'રોકડ (Cash)',
        remarksGuj: 'દ્વિતીય હપ્તો જમા',
        operatorGuj: 'મનીષ મહેતા (એકાઉન્ટન્ટ)'
      }
    ]
  }
];

export const DEFAULT_ASSETS: Asset[] = [
  {
    id: 'ast1',
    nameGuj: 'ટ્રસ્ટ ભવન જમીન',
    typeGuj: 'જમીન (Land)',
    purchaseDate: '2021-05-10',
    purchaseAmount: 2500000,
    depreciationRate: 0,
    currentValue: 2500000,
    remarksGuj: 'મુખ્ય ઓફિસ હેતુ માટે ફાળવેલ પ્લોટ'
  },
  {
    id: 'ast2',
    nameGuj: 'ટ્રસ્ટ ભવન મુખ્ય બિલ્ડિંગ',
    typeGuj: 'મકાન (Building)',
    purchaseDate: '2022-10-15',
    purchaseAmount: 1800000,
    depreciationRate: 5,
    currentValue: 1475000,
    remarksGuj: 'બે માળનું ઓફિસ ભવન, ૫% ઘસારા દર'
  },
  {
    id: 'ast3',
    nameGuj: 'ઓફિસ ડેસ્ક અને બેઠક ફર્નિચર',
    typeGuj: 'ફર્નિચર (Furniture)',
    purchaseDate: '2023-01-20',
    purchaseAmount: 240000,
    depreciationRate: 10,
    currentValue: 175000,
    remarksGuj: 'સોફા, કોન્ફરન્સ ટેબલ અને એક્ઝિક્યુટિવ ચેર'
  },
  {
    id: 'ast4',
    nameGuj: 'મુખ્ય કોમ્પ્યુટરો અને પ્રિન્ટર',
    typeGuj: 'કમ્પ્યુટર (Computer)',
    purchaseDate: '2024-03-05',
    purchaseAmount: 85000,
    depreciationRate: 40,
    currentValue: 30600,
    remarksGuj: 'ઓફિસ એકાઉન્ટિંગ કોમ્પ્યુટર અને લેસર પ્રિન્ટર'
  }
];

export const DEFAULT_DOCUMENTS: DocumentMeta[] = [
  {
    id: 'doc1',
    titleGuj: 'ટ્રસ્ટ રજીસ્ટ્રેશન ડીડ (અમદાવાદ)',
    typeGuj: 'ટ્રસ્ટ ડીડ (Trust Deed)',
    uploadDate: '2026-05-01',
    fileSize: '4.8 MB',
    fileType: 'application/pdf',
    remarksGuj: 'સહાયક ચેરિટી કમિશ્નર ઓફિસ દ્વારા મંજૂર અસલ નકલ'
  },
  {
    id: 'doc2',
    titleGuj: 'ટ્રસ્ટ PAN કાર્ડ નકલ',
    typeGuj: 'PAN કાર્ડ',
    uploadDate: '2026-05-02',
    fileSize: '1.2 MB',
    fileType: 'image/png',
    remarksGuj: 'ટ્રસ્ટ આઈટીઆર ફાઈલિંગ માટે માન્ય દસ્તાવેજ'
  },
  {
    id: 'doc3',
    titleGuj: '12A મુક્તિ પ્રમાણપત્ર દસ્તાવેજ',
    typeGuj: '12A પ્રમાણપત્ર',
    uploadDate: '2026-05-15',
    fileSize: '2.5 MB',
    fileType: 'application/pdf',
    remarksGuj: 'આવકવેરા વિભાગ આજીવન આવક મુક્તિ પ્રમાણપત્ર'
  },
  {
    id: 'doc4',
    titleGuj: '80G કર મુક્તિ દાતા પ્રમાણપત્ર નકલ',
    typeGuj: '80G પ્રમાણપત્ર',
    uploadDate: '2026-05-16',
    fileSize: '3.1 MB',
    fileType: 'application/pdf',
    remarksGuj: 'દાતાઓને ૫૦% કર મુક્તિ લાભ આપતું પ્રમાણપત્ર'
  }
];

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log1',
    timestamp: '2026-08-01 09:15:00',
    username: 'admin',
    actionGuj: 'વપરાશકર્તા લોગિન',
    moduleGuj: 'સુરક્ષા (Security)',
    detailsGuj: 'પ્રશાસક રમણલાલ શાહે સફળતાપૂર્વક લોગિન કર્યું.'
  },
  {
    id: 'log2',
    timestamp: '2026-08-01 09:30:12',
    username: 'accountant',
    actionGuj: 'આવક પાવતી ઉમેરી',
    moduleGuj: 'આવક (Income)',
    detailsGuj: 'પાવતી TR-2026-0004 ઉમેરી, રકમ રૂ. ૧૦,૦૦૦. દાન પ્રકાર: સદકા'
  },
  {
    id: 'log3',
    timestamp: '2026-08-01 10:10:44',
    username: 'accountant',
    actionGuj: 'બેંક ટ્રાન્ઝેક્શન મંજૂર',
    moduleGuj: 'બેંક (Bank)',
    detailsGuj: 'એસબીઆઈ બેંક ખાતામાંથી રૂ. ૪૫૦૦ વીજળી બિલ માટે ચૂકવ્યા.'
  }
];

export const DEFAULT_LICENSES: TrustLicense[] = [
  {
    id: 'lic_progressive',
    trustNameGuj: 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ',
    licenseKey: 'PROG-WELL-9823-ACTV-8822',
    registeredEmail: 'info@progressivewelfare.org',
    registeredPhone: '9825012345',
    activationDate: '2026-01-01',
    expiryDate: '2030-01-01',
    status: 'સક્રિય (Active)',
    version: 'v4.2.0'
  }
];

export const DEFAULT_TRUST_SETTINGS: TrustSettings = {
  trustNameGuj: 'પ્રોગ્રેસિવ વેલફેર ટ્રસ્ટ',
  trustNameEng: 'Progressive Welfare Trust',
  regNoGuj: 'E/7862/Ahmedabad',
  addressGuj: 'અમદાવાદ, ગુજરાત',
  phone: '+91 98250 12345',
  email: 'info@progressivewelfare.org',
  panNumber: 'AAATP1234F',
  tanNumber: 'AHMP01234G',
  section12ANo: 'AAATP1234F20211',
  section80GNo: 'AAATP1234F20224',
  financialYear: '૨૦૨૬-૨૭ (FY 2026-27)',
  receiptHeaderGuj: 'માનવ સેવા એ જ પ્રભુ સેવા - ૧૦૦% કરમુક્ત દાન પાવતી',
  logoUrl: '',
  openingCashBalance: 150000
};

export const DEFAULT_THARAVS: AgendaTharav[] = [
  {
    id: 'thr1',
    meetingNumber: '૨૦૨૬/૦૧',
    meetingType: 'કારોબારી સભા (Executive Committee)',
    meetingDate: '2026-04-10',
    meetingTime: '૧૧:૦૦ AM',
    venueGuj: 'ટ્રસ્ટ મુખ્ય કાર્યાલય, અમદાવાદ',
    chairpersonGuj: 'રમણલાલ કાંતિલાલ શાહ',
    presentMembersGuj: 'રમણલાલ શાહ, સુરેશચંદ્ર મહેતા, મનીષ મહેતા, પ્રવીણભાઈ વ્યાસ',
    agendaPointsGuj: '૧. પાછલી મિટિંગની પ્રોસીડિંગ્સ મંજૂર કરવી.\n૨. વાર્ષિક ઓડિટ હિસાબો રજૂ કરવા.',
    tharavNumber: 'ઠરાવ નં. ૧',
    subjectGuj: 'નાણાકીય વર્ષ ૨૦૨૫-૨૬ ના વાર્ષિક હિસાબો અને ઓડિટ રિપોર્ટ સર્વાનુમતે મંજૂર કરવા બાબત.',
    proposerGuj: 'સુરેશચંદ્ર બળવંતરાય મહેતા',
    seconderGuj: 'રમણલાલ કાંતિલાલ શાહ',
    statusGuj: 'સર્વાનુમતે મંજૂર (Unanimously Passed)',
    descriptionGuj: 'આજની કારોબારી મિટિંગમાં ચાર્ટર્ડ એકાઉન્ટન્ટશ્રી દ્વારા તૈયાર કરાયેલ નાણાકીય વર્ષ ૨૦૨૫-૨૬ નું આવક-જાવક હિસાબપત્રક, બેલેન્સ શીટ અને ઓડિટ રિપોર્ટ રજૂ કરવામાં આવ્યો. તમામ ઉપસ્થિત ટ્રસ્ટીશ્રીઓએ વિગતવાર ચર્ચા-વિચારણા બાદ આ ઓડિટ રિપોર્ટ સર્વાનુમતે મંજૂર કરવાનો નિર્ણય કર્યો.',
    actionAssignedToGuj: 'મનીષ ચીમનલાલ મહેતા (એકાઉન્ટન્ટ)',
    createdAt: '2026-04-10T12:30:00Z'
  },
  {
    id: 'thr2',
    meetingNumber: '૨૦૨૬/૦૨',
    meetingType: 'સાધારણ સભા (General Board)',
    meetingDate: '2026-06-15',
    meetingTime: '૦૪:૦૦ PM',
    venueGuj: 'ટ્રસ્ટ ભવન કોન્ફરન્સ હોલ',
    chairpersonGuj: 'સુરેશચંદ્ર બળવંતરાય મહેતા',
    presentMembersGuj: 'રમણલાલ શાહ, સુરેશચંદ્ર મહેતા, પ્રવીણભાઈ વ્યાસ',
    agendaPointsGuj: '૧. મેડિકલ અને શિષ્યવૃત્તિ સહાય કેમ્પનું આયોજન કરવું.',
    tharavNumber: 'ઠરાવ નં. ૨',
    subjectGuj: 'ગરીબ અને જરૂરિયાતમંદ વિદ્યાર્થીઓ માટે વાર્ષિક શિષ્યવૃત્તિ ફંડ મંજૂર કરવા અંગે.',
    proposerGuj: 'રમણલાલ કાંતિલાલ શાહ',
    seconderGuj: 'પ્રવીણભાઈ નરોત્તમ વ્યાસ',
    statusGuj: 'સર્વાનુમતે મંજૂર (Unanimously Passed)',
    descriptionGuj: 'ટ્રસ્ટના સામાજિક કલ્યાણ ઉદ્દેશ્યો હેઠળ આગામી શૈક્ષણિક વર્ષ માટે જરૂરિયાતમંદ વિદ્યાર્થીઓને શિષ્યવૃત્તિ આપવા અર્થે રૂ. ૨,૫૦,૦૦૦ નું વિશેષ શિષ્યવૃત્તિ ફાળવણી બજેટ સર્વાનુમતે મંજૂર કરવામાં આવ્યું છે.',
    actionAssignedToGuj: 'પ્રવીણભાઈ નરોત્તમ વ્યાસ (સ્વયંસેવક)',
    createdAt: '2026-06-15T17:00:00Z'
  }
];

export const DEFAULT_INVENTORY_ITEMS: any[] = [
  {
    id: 'item1',
    nameGuj: 'ધાર્મિક પુસ્તકો અને સાહિત્ય',
    nameEng: 'Religious Books & Literature',
    sku: 'BOK-001',
    unitGuj: 'નંગ (Pcs)',
    openingStock: 150,
    currentStock: 120,
    purchasePrice: 60,
    salesPrice: 100,
    descriptionGuj: 'ટ્રસ્ટ દ્વારા વેચાણ અને વિતરણ માટેનું સાહિત્ય.'
  },
  {
    id: 'item2',
    nameGuj: 'આયુર્વેદિક હેલ્થ કીટ',
    nameEng: 'Ayurvedic Health Kit',
    sku: 'MED-002',
    unitGuj: 'કીટ (Kit)',
    openingStock: 50,
    currentStock: 42,
    purchasePrice: 120,
    salesPrice: 200,
    descriptionGuj: 'જરૂરિયાતમંદો માટે વિતરણ અર્થે તેમજ વેચાણ અર્થે આયુર્વેદિક કીટ.'
  },
  {
    id: 'item3',
    nameGuj: 'ટ્રસ્ટ સિરામિક કપ / સુવેનીર',
    nameEng: 'Trust Ceramic Cup / Souvenir',
    sku: 'SOU-003',
    unitGuj: 'નંગ (Pcs)',
    openingStock: 200,
    currentStock: 185,
    purchasePrice: 35,
    salesPrice: 70,
    descriptionGuj: 'ટ્રસ્ટ લોગો અને સુવાક્યો સાથેનો માટીનો કપ.'
  }
];

export const DEFAULT_PURCHASE_BILLS: any[] = [
  {
    id: 'pur1',
    billNumber: 'PR-2026-0001',
    date: '2026-04-12',
    supplierNameGuj: 'આરાધના પ્રિન્ટર્સ (વડોદરા)',
    itemId: 'item1',
    itemNameGuj: 'ધાર્મિક પુસ્તકો અને સાહિત્ય',
    quantity: 50,
    rate: 60,
    totalAmount: 3000,
    paymentMode: 'રોકડ (Cash)'
  },
  {
    id: 'pur2',
    billNumber: 'PR-2026-0002',
    date: '2026-05-18',
    supplierNameGuj: 'હરિ ઓમ ફાર્માસ્યુટિકલ્સ',
    itemId: 'item2',
    itemNameGuj: 'આયુર્વેદિક હેલ્થ કીટ',
    quantity: 20,
    rate: 120,
    totalAmount: 2400,
    paymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    bankId: 'bnk1'
  }
];

export const DEFAULT_SALES_BILLS: any[] = [
  {
    id: 'sal1',
    billNumber: 'SL-2026-0001',
    date: '2026-04-20',
    customerNameGuj: 'નિતિનભાઈ હર્ષદરાય મહેતા',
    itemId: 'item1',
    itemNameGuj: 'ધાર્મિક પુસ્તકો અને સાહિત્ય',
    quantity: 10,
    rate: 100,
    totalAmount: 1000,
    paymentMode: 'રોકડ (Cash)'
  },
  {
    id: 'sal2',
    billNumber: 'SL-2026-0002',
    date: '2026-05-25',
    customerNameGuj: 'કેતનકુમાર રાવલ',
    itemId: 'item2',
    itemNameGuj: 'આયુર્વેદિક હેલ્થ કીટ',
    quantity: 5,
    rate: 200,
    totalAmount: 1000,
    paymentMode: 'બેંક ટ્રાન્સફર (Bank)',
    bankId: 'bnk1'
  }
];



