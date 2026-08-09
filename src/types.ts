/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Accountant' | 'DataEntry' | 'ReadOnly';

export interface User {
  id: string;
  username: string;
  nameGuj: string;
  role: UserRole;
  roleGuj: string;
  passwordHash: string;
  isActive: boolean;
  trustNameGuj?: string;
  isVendorRegistered?: boolean;
}

export interface Donor {
  id: string;
  nameGuj: string;
  phone: string;
  addressGuj: string;
  panNumber: string;
  aadharNumber: string;
  email: string;
  createdAt: string;
}

export type IncomeCategory = string;

export interface IncomeReceipt {
  id: string;
  receiptNumber: string;
  date: string;
  donorId: string;
  donorNameGuj: string;
  category: IncomeCategory;
  amount: number;
  paymentMode: 'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)';
  bankId?: string;
  chequeNumber?: string;
  remarksGuj: string;
  operatorGuj: string;
  isDeleted?: boolean;
}

export type ExpenseCategory = string;

export interface ExpenseVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  paidToGuj: string;
  paymentMode: 'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)';
  bankId?: string;
  chequeNumber?: string;
  remarksGuj: string;
  approvedByGuj: string;
  operatorGuj: string;
  isDeleted?: boolean;
}

export type MemberCategory = 'સભાસદ (Society Member)' | 'ટ્રસ્ટ હોદ્દેદાર / કમિટી સભ્ય (Trustee / Board Member)' | 'કર્મચારી / અન્ય (Staff / Volunteer)';

export interface TrustMember {
  id: string;
  memberNo?: string;
  nameGuj: string;
  memberCategory?: MemberCategory;
  roleGuj: 'સભાસદ / શેરહોલ્ડર (Member / Shareholder)' | 'આજીવન સભાસદ (Life Member)' | 'સાધારણ સભાસદ (Ordinary Member)' | 'ટ્રસ્ટી (Trustee)' | 'પ્રમુખશ્રી (President)' | 'ઉપપ્રમુખ (Vice President)' | 'મંત્રી / સેક્રેટરી (Secretary)' | 'ખજાનચી (Treasurer)' | 'કમિટી સભ્ય (Committee Member)' | 'કર્મચારી (Employee)' | 'સ્વયંસેવક (Volunteer)' | string;
  phone: string;
  email: string;
  addressGuj: string;
  joiningDate: string;
  profilePhoto?: string;

  // Membership Fee (પ્રવેશ ફી)
  membershipFee?: number;
  feePaymentMode?: 'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)';
  feePaymentStatus?: 'ચૂકવેલ (Paid)' | 'બાકી (Pending)';
  feeReceiptNumber?: string;
  feePaymentDate?: string;

  // Share Holding Summary (શેર વિગત)
  folioNumber?: string;
  shareCount?: number;
  sharePrice?: number;
  totalShareAmount?: number;
  shareCertificateNo?: string;
}

export interface MemberSharePurchase {
  id: string;
  memberId: string;
  memberNameGuj: string;
  folioNumber: string;
  certificateNo: string;
  date: string;
  shareCount: number;
  sharePrice: number;
  totalAmount: number;
  paymentMode: 'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)';
  remarksGuj?: string;
}

export interface MemberLoanRepayment {
  id: string;
  loanId: string;
  installmentNo: number;
  date: string;
  principalPaid: number;
  interestPaid: number;
  penaltyOrOtherFee?: number;
  totalPaid: number;
  receiptNumber: string;
  paymentMode: 'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)';
  bankId?: string;
  remarksGuj?: string;
  operatorGuj?: string;
}

export interface MemberLoanApplication {
  id: string;
  applicationNo: string;
  date: string;
  memberId: string;
  memberNameGuj: string;
  memberNo?: string;
  folioNumber?: string;
  bankNameGuj: string;
  branchGuj: string;
  loanTypeGuj: 'ખેતી વિષયક ધિરાણ (Agricultural Loan)' | 'પશુપાલન / ડેરી ધિરાણ (Cattle/Dairy Loan)' | 'વ્યવસાય ધિરાણ (Business Loan)' | 'મકાન / ગૃહ નિર્માણ લોન (Home Loan)' | 'વ્યક્તિગત લોન (Personal Loan)';
  requestedAmount: number;
  recommendedAmount: number;
  purposeGuj: string;
  guarantor1NameGuj?: string;
  guarantor2NameGuj?: string;
  statusGuj: 'અરજી મળેલ (Pending)' | 'ભલામણ મંજૂર / NOC ઇશ્યુ (Recommended & NOC Issued)' | 'ના-મંજૂર (Rejected)' | 'બેંક દ્વારા લોન મંજૂર અને ચુકવણી થયેલ (Sanctioned & Disbursed)' | 'લોન પૂર્ણ / ભરપાઈ થયેલ (Closed / Fully Repaid)';
  recommendationLetterNo?: string;
  approvalDate?: string;
  remarksGuj?: string;

  // Post Sanction & Disbursement Details
  sanctionedAmount?: number;
  sanctionLetterNo?: string;
  disbursementDate?: string;
  disbursementMode?: 'બેંક ખાતામાં જમા (Bank Transfer)' | 'ચેક (Cheque)' | 'રોકડ / ડીડી (Cash/DD)';
  chequeOrRefNo?: string;
  interestRate?: number; // % annual interest
  tenureMonths?: number; // duration in months
  monthlyInstallmentAmount?: number;
  repayments?: MemberLoanRepayment[];
}

export interface BankAccount {
  id: string;
  bankNameGuj: string;
  accountNumber: string;
  branchGuj: string;
  ifscCode: string;
  balance: number;
  openingBalance?: number;
  isActive: boolean;
}

export interface BankTransaction {
  id: string;
  date: string;
  type: 'જમા (Deposit)' | 'ઉપાડ (Withdrawal)' | 'ટ્રાન્સફર (Transfer)';
  amount: number;
  fromAccount?: string;
  toAccount?: string;
  chequeNumber?: string;
  isCleared: boolean;
  clearanceDate?: string;
  remarksGuj: string;
}

export interface Asset {
  id: string;
  nameGuj: string;
  typeGuj: 'જમીન (Land)' | 'મકાન (Building)' | 'ફર્નિચર (Furniture)' | 'કમ્પ્યુટર (Computer)' | 'વાહન (Vehicle)' | 'સાધનો (Equipment)';
  purchaseDate: string;
  purchaseAmount: number;
  depreciationRate: number; // percentage, e.g. 10 for 10%
  currentValue: number;
  remarksGuj: string;
  quantity?: number;
  locationGuj?: string;
  conditionGuj?: 'ઉત્તમ ચાલુ સ્થિતિ (Good)' | 'સમારકામ યોગ્ય (Needs Repair)' | 'બિનઉપયોગી/ભંગાર (Scrap)';
  billRefGuj?: string;
  deadStockNo?: string;
}

export interface DocumentMeta {
  id: string;
  titleGuj: string;
  typeGuj: 'ટ્રસ્ટ ડીડ (Trust Deed)' | 'PAN કાર્ડ' | '12A પ્રમાણપત્ર' | '80G પ્રમાણપત્ર' | 'નોંધણી પ્રમાણપત્ર' | 'ઓડિટ રિપોર્ટ' | 'અન્ય';
  uploadDate: string;
  fileSize: string;
  fileType: string;
  remarksGuj: string;
  fileDataUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  actionGuj: string;
  moduleGuj: string;
  detailsGuj: string;
}

export interface AgendaTharav {
  id: string;
  meetingNumber: string;
  meetingType: 'કારોબારી સભા (Executive Committee)' | 'સાધારણ સભા (General Board)' | 'વાર્ષિક સાધારણ સભા (AGM)' | 'ખાસ કટોકટી સભા (Emergency Meeting)';
  meetingDate: string;
  meetingTime?: string;
  venueGuj?: string;
  chairpersonGuj?: string;
  presentMembersGuj?: string;
  agendaPointsGuj?: string;
  
  // Tharav details
  tharavNumber: string;
  subjectGuj: string;
  proposerGuj: string;
  seconderGuj: string;
  statusGuj: 'સર્વાનુમતે મંજૂર (Unanimously Passed)' | 'બહુમતીથી મંજૂર (Passed by Majority)' | 'મુલતવી (Deferred/Rejected)';
  descriptionGuj: string;
  actionAssignedToGuj?: string;
  createdAt: string;
}

// Super Admin License Models
export interface TrustLicense {
  id: string;
  trustNameGuj: string;
  licenseKey: string;
  registeredEmail: string;
  registeredPhone: string;
  activationDate: string;
  expiryDate: string;
  status: 'સક્રિય (Active)' | 'અસક્રિય (Inactive)' | 'મુદત પૂરી (Expired)';
  version: string;
}

export interface TrustSettings {
  trustNameGuj: string;
  trustNameEng: string;
  regNoGuj: string;
  registrationNumber?: string;
  addressGuj: string;
  phone: string;
  email: string;
  panNumber: string;
  tanNumber: string;
  section12ANo: string;
  section80GNo: string;
  financialYear: string;
  receiptHeaderGuj: string;
  logoUrl?: string;
  openingCashBalance?: number;
}

export interface InventoryItem {
  id: string;
  nameGuj: string;
  nameEng?: string;
  sku: string;
  unitGuj: string; // e.g. 'નંગ (Pcs)', 'કિલો (Kg)'
  openingStock: number;
  currentStock: number;
  purchasePrice: number;
  salesPrice: number;
  descriptionGuj: string;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  date: string;
  supplierNameGuj: string;
  itemId: string;
  itemNameGuj: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  paymentMode: 'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)';
  bankId?: string;
  remarksGuj?: string;
}

export interface SalesBill {
  id: string;
  billNumber: string;
  date: string;
  customerNameGuj: string;
  itemId: string;
  itemNameGuj: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  paymentMode: 'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)';
  bankId?: string;
  remarksGuj?: string;
}

