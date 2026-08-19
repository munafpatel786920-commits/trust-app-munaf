/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  Award,
  Phone,
  Mail,
  X,
  Edit3,
  Trash2,
  Printer,
  Download,
  CreditCard,
  Building2,
  FileText,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  PieChart,
  HelpCircle,
  FileCheck,
  Filter
} from 'lucide-react';
import { TrustMember, MemberSharePurchase, MemberLoanApplication, MemberLoanRepayment, TrustSettings, MemberCategory } from '../types';
import { downloadContainerAsPDF, printContainer } from '../utils/pdfPrint';

interface MemberModuleProps {
  members: TrustMember[];
  onAddMember: (member: Omit<TrustMember, 'id'>) => void;
  onEditMember?: (member: TrustMember) => void;
  onDeleteMember?: (id: string) => void;
  
  sharePurchases?: MemberSharePurchase[];
  onAddSharePurchase?: (shareData: Omit<MemberSharePurchase, 'id'>) => void;
  onDeleteSharePurchase?: (id: string) => void;
  
  loanApplications?: MemberLoanApplication[];
  onAddLoanApplication?: (loanData: Omit<MemberLoanApplication, 'id'>) => void;
  onEditLoanApplication?: (loanData: MemberLoanApplication) => void;
  onDeleteLoanApplication?: (id: string) => void;
  onAddReceipt?: (receiptData: any) => void;

  trustSettings?: TrustSettings;
  currentUser: { role: string };
  darkMode: boolean;
  viewMode?: 'sabhasad' | 'trust' | 'all';
}

export default function MemberModule({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  sharePurchases = [],
  onAddSharePurchase,
  onDeleteSharePurchase,
  loanApplications = [],
  onAddLoanApplication,
  onEditLoanApplication,
  onDeleteLoanApplication,
  onAddReceipt,
  trustSettings,
  currentUser,
  darkMode,
  viewMode = 'all'
}: MemberModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'shares' | 'loans' | 'reports'>('members');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'sabhasad' | 'trust' | 'staff'>(() => {
    if (viewMode === 'trust') return 'trust';
    if (viewMode === 'sabhasad') return 'sabhasad';
    return 'all';
  });

  useEffect(() => {
    if (viewMode === 'trust') {
      setCategoryFilter('trust');
    } else if (viewMode === 'sabhasad') {
      setCategoryFilter('sabhasad');
    } else if (viewMode === 'all') {
      setCategoryFilter('all');
    }
  }, [viewMode]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Helper function to identify member category key
  const getMemberCategoryKey = (m: TrustMember): 'sabhasad' | 'trust' | 'staff' => {
    if (m.memberCategory) {
      const cat = m.memberCategory.toLowerCase();
      if (cat.includes('સભાસદ') || cat.includes('society') || cat.includes('member') || cat.includes('શેરહોલ્ડર') || cat.includes('સાધારણ') || cat.includes('આજીવન')) {
        if (!cat.includes('ટ્રસ્ટ') && !cat.includes('કમિટી') && !cat.includes('trustee') && !cat.includes('board')) {
          return 'sabhasad';
        }
      }
      if (cat.includes('ટ્રસ્ટ') || cat.includes('કમિટી') || cat.includes('trustee') || cat.includes('board')) return 'trust';
      if (cat.includes('કર્મચારી') || cat.includes('staff') || cat.includes('volunteer') || cat.includes('સ્વયંસેવક') || cat.includes('employee')) return 'staff';
    }
    const r = (m.roleGuj || '').toLowerCase();
    if (r.includes('ટ્રસ્ટી') || r.includes('પ્રમુખ') || r.includes('મંત્રી') || r.includes('ખજાનચી') || r.includes('કમિટી') || r.includes('ઉપપ્રમુખ') || r.includes('trustee') || r.includes('president') || r.includes('secretary') || r.includes('treasurer')) {
      return 'trust';
    }
    if (r.includes('કર્મચારી') || r.includes('સ્વયંસેવક') || r.includes('staff') || r.includes('employee') || r.includes('volunteer') || r.includes('peon') || r.includes('clerk')) {
      return 'staff';
    }
    return 'sabhasad';
  };

  // --- MEMBER FORM STATES ---
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TrustMember | null>(null);
  const [memberNo, setMemberNo] = useState('');
  const [nameGuj, setNameGuj] = useState('');
  const [memberCategory, setMemberCategory] = useState<MemberCategory>('સભાસદ (Society Member)');
  const [roleGuj, setRoleGuj] = useState<TrustMember['roleGuj']>('સભાસદ / શેરહોલ્ડર (Member / Shareholder)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressGuj, setAddressGuj] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  
  // Fee details
  const [membershipFee, setMembershipFee] = useState<number>(500);
  const [feePaymentMode, setFeePaymentMode] = useState<'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)'>('રોકડ (Cash)');
  const [feePaymentStatus, setFeePaymentStatus] = useState<'ચૂકવેલ (Paid)' | 'બાકી (Pending)'>('ચૂકવેલ (Paid)');
  const [feeReceiptNumber, setFeeReceiptNumber] = useState('');
  const [feePaymentDate, setFeePaymentDate] = useState('');

  // Share details on member
  const [folioNumber, setFolioNumber] = useState('');
  const [shareCount, setShareCount] = useState<number>(10);
  const [sharePrice, setSharePrice] = useState<number>(100);
  const [shareCertificateNo, setShareCertificateNo] = useState('');

  // --- SHARE PURCHASE FORM STATES ---
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareMemberId, setSelectedShareMemberId] = useState('');
  const [newShareFolioNo, setNewShareFolioNo] = useState('');
  const [newShareCertNo, setNewShareCertNo] = useState('');
  const [newShareCount, setNewShareCount] = useState<number>(10);
  const [newSharePrice, setNewSharePrice] = useState<number>(100);
  const [newShareDate, setNewShareDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSharePaymentMode, setNewSharePaymentMode] = useState<'રોકડ (Cash)' | 'બેંક ટ્રાન્સફર (Bank)' | 'ચેક (Cheque)'>('બેંક ટ્રાન્સફર (Bank)');
  const [newShareRemarks, setNewShareRemarks] = useState('');

  // --- LOAN APPLICATION FORM STATES ---
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<MemberLoanApplication | null>(null);
  const [loanAppNo, setLoanAppNo] = useState('');
  const [loanAppDate, setLoanAppDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanMemberId, setLoanMemberId] = useState('');
  const [bankNameGuj, setBankNameGuj] = useState('ધી સુરત ડિસ્ટ્રિક્ટ કો-ઓપરેટિવ બેંક લી.');
  const [branchGuj, setBranchGuj] = useState('');
  const [loanTypeGuj, setLoanTypeGuj] = useState<MemberLoanApplication['loanTypeGuj']>('ખેતી વિષયક ધિરાણ (Agricultural Loan)');
  const [requestedAmount, setRequestedAmount] = useState<number>(100000);
  const [recommendedAmount, setRecommendedAmount] = useState<number>(100000);
  const [loanPurposeGuj, setLoanPurposeGuj] = useState('');
  const [guarantor1NameGuj, setGuarantor1NameGuj] = useState('');
  const [guarantor2NameGuj, setGuarantor2NameGuj] = useState('');
  const [loanStatusGuj, setLoanStatusGuj] = useState<MemberLoanApplication['statusGuj']>('ભલામણ મંજૂર / NOC ઇશ્યુ (Recommended & NOC Issued)');
  const [recommendationLetterNo, setRecommendationLetterNo] = useState('');
  const [loanApprovalDate, setLoanApprovalDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanRemarksGuj, setLoanRemarksGuj] = useState('');

  // --- PRINTABLE CERTIFICATE & RECEIPT VIEW MODALS ---
  const [selectedFeeMember, setSelectedFeeMember] = useState<TrustMember | null>(null);
  const [selectedShareCertData, setSelectedShareCertData] = useState<{ member: TrustMember; purchase?: MemberSharePurchase } | null>(null);
  const [selectedLoanCertData, setSelectedLoanCertData] = useState<MemberLoanApplication | null>(null);

  // --- BANK LOAN DISBURSEMENT & REPAYMENT STATES ---
  const [disbursementLoan, setDisbursementLoan] = useState<MemberLoanApplication | null>(null);
  const [sanctionedAmount, setSanctionedAmount] = useState<number>(100000);
  const [sanctionLetterNo, setSanctionLetterNo] = useState<string>('');
  const [disbursementDate, setDisbursementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [disbursementMode, setDisbursementMode] = useState<MemberLoanApplication['disbursementMode']>('બેંક ખાતામાં જમા (Bank Transfer)');
  const [chequeOrRefNo, setChequeOrRefNo] = useState<string>('');
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [monthlyInstallmentAmount, setMonthlyInstallmentAmount] = useState<number>(8715);

  const [repaymentLoan, setRepaymentLoan] = useState<MemberLoanApplication | null>(null);
  const [repaymentDate, setRepaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [repaymentPrincipal, setRepaymentPrincipal] = useState<number>(8000);
  const [repaymentInterest, setRepaymentInterest] = useState<number>(715);
  const [repaymentMode, setRepaymentMode] = useState<MemberLoanRepayment['paymentMode']>('રોકડ (Cash)');
  const [repaymentReceiptNo, setRepaymentReceiptNo] = useState<string>('');
  const [repaymentRemarks, setRepaymentRemarks] = useState<string>('');

  const [selectedLoanLedgerData, setSelectedLoanLedgerData] = useState<MemberLoanApplication | null>(null);
  const [selectedDisbursementAdviceData, setSelectedDisbursementAdviceData] = useState<MemberLoanApplication | null>(null);

  const handleOpenDisbursement = (loan: MemberLoanApplication) => {
    setDisbursementLoan(loan);
    const amt = loan.sanctionedAmount || loan.recommendedAmount || loan.requestedAmount || 100000;
    setSanctionedAmount(amt);
    setSanctionLetterNo(loan.sanctionLetterNo || `SNC/BANK/${new Date().getFullYear()}/${String(loanApplications.length + 1).padStart(3, '0')}`);
    setDisbursementDate(loan.disbursementDate || new Date().toISOString().split('T')[0]);
    setDisbursementMode(loan.disbursementMode || 'બેંક ખાતામાં જમા (Bank Transfer)');
    setChequeOrRefNo(loan.chequeOrRefNo || `UTR-${Date.now().toString().slice(-8)}`);
    setInterestRate(loan.interestRate || 8.5);
    setTenureMonths(loan.tenureMonths || 12);
    setMonthlyInstallmentAmount(loan.monthlyInstallmentAmount || Math.round(amt / 12));
  };

  const handleSaveDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disbursementLoan || !onEditLoanApplication) return;
    const updated: MemberLoanApplication = {
      ...disbursementLoan,
      statusGuj: 'બેંક દ્વારા લોન મંજૂર અને ચુકવણી થયેલ (Sanctioned & Disbursed)',
      sanctionedAmount: Number(sanctionedAmount),
      sanctionLetterNo,
      disbursementDate,
      disbursementMode,
      chequeOrRefNo,
      interestRate: Number(interestRate),
      tenureMonths: Number(tenureMonths),
      monthlyInstallmentAmount: Number(monthlyInstallmentAmount)
    };
    onEditLoanApplication(updated);
    alert(`✓ લોન મંજૂરી અને ચુકવણી નોંધ કાયદેસર રીતે સાચવવામાં આવી છે (મંજૂરી પત્રક નં. ${sanctionLetterNo}).`);
    setDisbursementLoan(null);
  };

  const handleOpenRepayment = (loan: MemberLoanApplication) => {
    setRepaymentLoan(loan);
    setRepaymentDate(new Date().toISOString().split('T')[0]);
    const totalP = loan.sanctionedAmount || loan.recommendedAmount || 100000;
    const paidSoFar = (loan.repayments || []).reduce((sum, r) => sum + (r.principalPaid || 0), 0);
    const remP = Math.max(0, totalP - paidSoFar);
    const estP = Math.min(remP, Math.round(totalP / (loan.tenureMonths || 12)));
    const estI = Math.round((remP * (loan.interestRate || 8.5)) / (12 * 100));

    setRepaymentPrincipal(estP);
    setRepaymentInterest(estI);
    setRepaymentMode('રોકડ (Cash)');
    setRepaymentReceiptNo(`LRCP-${new Date().getFullYear()}-${String((loan.repayments?.length || 0) + 1).padStart(3, '0')}`);
    setRepaymentRemarks(`હપ્તો નં. ${(loan.repayments?.length || 0) + 1} જમા`);
  };

  const handleSaveRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repaymentLoan || !onEditLoanApplication) return;

    const currentRepayments = repaymentLoan.repayments || [];
    const newRepayment: MemberLoanRepayment = {
      id: 'rpm-' + Date.now(),
      loanId: repaymentLoan.id,
      installmentNo: currentRepayments.length + 1,
      date: repaymentDate,
      principalPaid: Number(repaymentPrincipal),
      interestPaid: Number(repaymentInterest),
      totalPaid: Number(repaymentPrincipal) + Number(repaymentInterest),
      receiptNumber: repaymentReceiptNo || `LRCP-${Date.now().toString().slice(-4)}`,
      paymentMode: repaymentMode,
      remarksGuj: repaymentRemarks || `હપ્તો નં. ${currentRepayments.length + 1} જમા`,
      operatorGuj: currentUser?.role || 'એકાઉન્ટન્ટ'
    };

    const updatedRepayments = [...currentRepayments, newRepayment];
    const totalPrincipalPaidNow = updatedRepayments.reduce((sum, r) => sum + r.principalPaid, 0);
    const targetSanction = repaymentLoan.sanctionedAmount || repaymentLoan.recommendedAmount || 100000;

    let updatedStatus = repaymentLoan.statusGuj;
    if (totalPrincipalPaidNow >= targetSanction) {
      updatedStatus = 'લોન પૂર્ણ / ભરપાઈ થયેલ (Closed / Fully Repaid)';
    }

    const updatedLoan: MemberLoanApplication = {
      ...repaymentLoan,
      repayments: updatedRepayments,
      statusGuj: updatedStatus
    };

    onEditLoanApplication(updatedLoan);

    if (onAddReceipt) {
      onAddReceipt({
        receiptNumber: newRepayment.receiptNumber,
        date: newRepayment.date,
        donorNameGuj: `${repaymentLoan.memberNameGuj} (સભાસદ લોન હપ્તો નં. ${newRepayment.installmentNo})`,
        amount: newRepayment.totalPaid,
        category: 'સભાસદ લોન હપ્તો (Member Loan Repayment)',
        paymentMode: newRepayment.paymentMode,
        remarksGuj: newRepayment.remarksGuj || `હપ્તો નં. ${newRepayment.installmentNo} જમા (મુદ્દલ: ₹${newRepayment.principalPaid}, વ્યાજ: ₹${newRepayment.interestPaid})`,
        operatorGuj: currentUser?.role || 'એકાઉન્ટન્ટ',
        isCleared: true
      });
    }

    alert(`✓ સભાસદ લોન હપ્તો ₹ ${newRepayment.totalPaid.toLocaleString('en-IN')} (પાવતી નં. ${newRepayment.receiptNumber}) સફળતાપૂર્વક જમા થઈ.`);
    setRepaymentLoan(null);
  };

  // --- CONSOLIDATED BANK LOAN RECOMMENDATION SCHEDULE PATRAK STATES ---
  const [showConsolidatedPatrakModal, setShowConsolidatedPatrakModal] = useState(false);
  const [patrakBankFilter, setPatrakBankFilter] = useState('all');
  const [patrakStatusFilter, setPatrakStatusFilter] = useState('all');
  const [patrakOutwardNo, setPatrakOutwardNo] = useState('OUT/BANK-PATRAK/2026/01');
  const [patrakDate, setPatrakDate] = useState(new Date().toISOString().split('T')[0]);
  const [patrakResolutionNo, setPatrakResolutionNo] = useState('કારોબારી ઠરાવ નં. ૦૫/૨૦૨૬');
  const [patrakResolutionDate, setPatrakResolutionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLoanIdsForPatrak, setSelectedLoanIdsForPatrak] = useState<string[]>([]);

  // --- GENERAL SABHASAD LOAN STATEMENT STATES ---
  const [showGeneralLoanStatementModal, setShowGeneralLoanStatementModal] = useState(false);
  const [generalLoanBankFilter, setGeneralLoanBankFilter] = useState('all');
  const [generalLoanStatusFilter, setGeneralLoanStatusFilter] = useState('all');
  const [generalLoanSearchQuery, setGeneralLoanSearchQuery] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<'members' | 'generalLoanStatement'>('members');

  const generalFilteredLoans = loanApplications.filter(l => {
    if (generalLoanBankFilter !== 'all' && l.bankNameGuj !== generalLoanBankFilter) return false;
    if (generalLoanStatusFilter !== 'all' && l.statusGuj !== generalLoanStatusFilter) return false;
    if (generalLoanSearchQuery.trim()) {
      const q = generalLoanSearchQuery.toLowerCase();
      return (
        l.memberNameGuj.toLowerCase().includes(q) ||
        (l.memberNo && l.memberNo.toLowerCase().includes(q)) ||
        l.applicationNo.toLowerCase().includes(q) ||
        (l.recommendationLetterNo && l.recommendationLetterNo.toLowerCase().includes(q)) ||
        (l.sanctionLetterNo && l.sanctionLetterNo.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalGenSanctionedAmt = generalFilteredLoans.reduce((sum, l) => sum + (l.sanctionedAmount || l.recommendedAmount || l.requestedAmount || 0), 0);
  const totalGenPrincipalPaid = generalFilteredLoans.reduce((sum, l) => sum + (l.repayments || []).reduce((rSum, r) => rSum + (r.principalPaid || 0), 0), 0);
  const totalGenInterestPaid = generalFilteredLoans.reduce((sum, l) => sum + (l.repayments || []).reduce((rSum, r) => rSum + (r.interestPaid || 0), 0), 0);
  const totalGenTotalPaid = totalGenPrincipalPaid + totalGenInterestPaid;
  const totalGenRemainingBal = Math.max(0, totalGenSanctionedAmt - totalGenPrincipalPaid);

  const handleOpenConsolidatedPatrak = () => {
    setSelectedLoanIdsForPatrak(loanApplications.map(l => l.id));
    setShowConsolidatedPatrakModal(true);
  };

  const uniqueBankNames = Array.from(new Set(loanApplications.map(l => l.bankNameGuj).filter(Boolean)));

  const patrakFilteredLoans = loanApplications.filter(l => {
    if (patrakBankFilter !== 'all' && l.bankNameGuj !== patrakBankFilter) return false;
    if (patrakStatusFilter !== 'all' && l.statusGuj !== patrakStatusFilter) return false;
    return true;
  });

  const patrakSelectedLoans = patrakFilteredLoans.filter(l => selectedLoanIdsForPatrak.includes(l.id));

  const totalPatrakRequested = patrakSelectedLoans.reduce((sum, l) => sum + (l.requestedAmount || 0), 0);
  const totalPatrakRecommended = patrakSelectedLoans.reduce((sum, l) => sum + (l.recommendedAmount || 0), 0);

  // PDF & Print Download helper
  const handleDownloadPDF = async (containerId: string, filename: string) => {
    try {
      setIsGeneratingPDF(true);
      await downloadContainerAsPDF(containerId, filename);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Filtered lists
  const filteredMembers = members.filter(m => {
    const cat = getMemberCategoryKey(m);
    if (categoryFilter !== 'all' && cat !== categoryFilter) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.nameGuj && m.nameGuj.toLowerCase().includes(q)) ||
      (m.memberNo && m.memberNo.toLowerCase().includes(q)) ||
      (m.folioNumber && m.folioNumber.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q)) ||
      (m.roleGuj && m.roleGuj.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.addressGuj && m.addressGuj.toLowerCase().includes(q))
    );
  });

  const filteredShares = sharePurchases.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.memberNameGuj.toLowerCase().includes(q) ||
      s.folioNumber.toLowerCase().includes(q) ||
      s.certificateNo.toLowerCase().includes(q)
    );
  });

  const filteredLoans = loanApplications.filter(l => {
    const q = searchQuery.toLowerCase();
    return (
      l.memberNameGuj.toLowerCase().includes(q) ||
      l.bankNameGuj.toLowerCase().includes(q) ||
      l.applicationNo.toLowerCase().includes(q) ||
      (l.recommendationLetterNo && l.recommendationLetterNo.toLowerCase().includes(q))
    );
  });

  // Calculate Key Summary Stats
  const sabhasadMembers = members.filter(m => getMemberCategoryKey(m) === 'sabhasad');
  const trustBoardMembers = members.filter(m => getMemberCategoryKey(m) === 'trust');
  const staffMembers = members.filter(m => getMemberCategoryKey(m) === 'staff');

  const totalPaidMembers = members.filter(m => m.feePaymentStatus === 'ચૂકવેલ (Paid)').length;
  const totalEntryFeesCollected = members.reduce((sum, m) => sum + (m.membershipFee || 0), 0);
  
  const totalShareholdersCount = members.filter(m => (m.shareCount || 0) > 0).length;
  const totalIssuedShares = members.reduce((sum, m) => sum + (m.shareCount || 0), 0) + 
                             sharePurchases.reduce((sum, s) => sum + s.shareCount, 0);
  const totalShareCapitalAmount = members.reduce((sum, m) => sum + (m.totalShareAmount || 0), 0);
  const totalSabhasadShareAmount = sabhasadMembers.reduce((sum, m) => sum + (m.totalShareAmount || 0), 0);

  const totalLoanAppsCount = loanApplications.length;
  const totalApprovedNOCs = loanApplications.filter(l => l.statusGuj === 'ભલામણ મંજૂર / NOC ઇશ્યુ (Recommended & NOC Issued)').length;
  const totalRecommendedLoanValue = loanApplications
    .filter(l => l.statusGuj === 'ભલામણ મંજૂર / NOC ઇશ્યુ (Recommended & NOC Issued)')
    .reduce((sum, l) => sum + l.recommendedAmount, 0);

  // --- MEMBER FORM HANDLERS ---
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setNameGuj('');
    setPhone('');
    setEmail('');
    setAddressGuj('');
    setJoiningDate(new Date().toISOString().split('T')[0]);

    if (categoryFilter === 'trust' || viewMode === 'trust') {
      setMemberNo(`T-00${members.length + 1}`);
      setMemberCategory('ટ્રસ્ટ હોદ્દેદાર / કમિટી સભ્ય (Trustee / Board Member)');
      setRoleGuj('ટ્રસ્ટી (Trustee)');
      setMembershipFee(0);
      setFeePaymentMode('રોકડ (Cash)');
      setFeePaymentStatus('ચૂકવેલ (Paid)');
      setFeeReceiptNumber('');
      setFeePaymentDate('');
      setFolioNumber('');
      setShareCount(0);
      setSharePrice(0);
      setShareCertificateNo('');
    } else {
      setMemberNo(`S-00${members.length + 1}`);
      setMemberCategory('સભાસદ (Society Member)');
      setRoleGuj('સભાસદ / શેરહોલ્ડર (Member / Shareholder)');
      setMembershipFee(500);
      setFeePaymentMode('રોકડ (Cash)');
      setFeePaymentStatus('ચૂકવેલ (Paid)');
      setFeeReceiptNumber(`FEE-${new Date().getFullYear()}-00${members.length + 1}`);
      setFeePaymentDate(new Date().toISOString().split('T')[0]);
      setFolioNumber('');
      setShareCount(0);
      setSharePrice(0);
      setShareCertificateNo('');
    }
    setShowMemberModal(true);
  };

  const handleOpenEditMember = (m: TrustMember) => {
    setEditingMember(m);
    setMemberNo(m.memberNo || `M-00${m.id}`);
    setNameGuj(m.nameGuj);

    const catKey = getMemberCategoryKey(m);
    if (m.memberCategory) {
      setMemberCategory(m.memberCategory);
    } else if (catKey === 'trust') {
      setMemberCategory('ટ્રસ્ટ હોદ્દેદાર / કમિટી સભ્ય (Trustee / Board Member)');
    } else if (catKey === 'staff') {
      setMemberCategory('કર્મચારી / અન્ય (Staff / Volunteer)');
    } else {
      setMemberCategory('સભાસદ (Society Member)');
    }

    setRoleGuj(m.roleGuj);
    setPhone(m.phone || '');
    setEmail(m.email || '');
    setAddressGuj(m.addressGuj || '');
    setJoiningDate(m.joiningDate || new Date().toISOString().split('T')[0]);
    setMembershipFee(m.membershipFee ?? 500);
    setFeePaymentMode(m.feePaymentMode || 'રોકડ (Cash)');
    setFeePaymentStatus(m.feePaymentStatus || 'ચૂકવેલ (Paid)');
    setFeeReceiptNumber(m.feeReceiptNumber || `FEE-${new Date().getFullYear()}-001`);
    setFeePaymentDate(m.feePaymentDate || m.joiningDate || new Date().toISOString().split('T')[0]);
    setFolioNumber(m.folioNumber || `FOLIO-00${m.id}`);
    setShareCount(m.shareCount || 0);
    setSharePrice(m.sharePrice || 100);
    setShareCertificateNo(m.shareCertificateNo || `CERT-${new Date().getFullYear()}-001`);
    setShowMemberModal(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameGuj) {
      alert('કૃપા કરીને પૂરું નામ દાખલ કરો.');
      return;
    }

    const isTrustMember = memberCategory.includes('ટ્રસ્ટ') || memberCategory.includes('Trustee');

    const finalFee = isTrustMember ? 0 : membershipFee;
    const finalShareCount = isTrustMember ? 0 : shareCount;
    const finalSharePrice = isTrustMember ? 0 : sharePrice;
    const calculatedTotalShare = finalShareCount * finalSharePrice;
    const finalFolio = isTrustMember ? '' : folioNumber;
    const finalCert = isTrustMember ? '' : shareCertificateNo;

    if (editingMember && onEditMember) {
      onEditMember({
        ...editingMember,
        memberNo,
        nameGuj,
        memberCategory,
        roleGuj,
        phone,
        email,
        addressGuj,
        joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        membershipFee: finalFee,
        feePaymentMode: isTrustMember ? 'રોકડ (Cash)' : feePaymentMode,
        feePaymentStatus: isTrustMember ? 'ચૂકવેલ (Paid)' : feePaymentStatus,
        feeReceiptNumber: isTrustMember ? '' : feeReceiptNumber,
        feePaymentDate: isTrustMember ? '' : feePaymentDate,
        folioNumber: finalFolio,
        shareCount: finalShareCount,
        sharePrice: finalSharePrice,
        totalShareAmount: calculatedTotalShare,
        shareCertificateNo: finalCert
      });
      alert(`✓ સભ્ય "${nameGuj}" ની વિગતો સફળતાપૂર્વક અપડેટ થઈ.`);
    } else {
      onAddMember({
        memberNo,
        nameGuj,
        memberCategory,
        roleGuj,
        phone,
        email,
        addressGuj,
        joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        membershipFee: finalFee,
        feePaymentMode: isTrustMember ? 'રોકડ (Cash)' : feePaymentMode,
        feePaymentStatus: isTrustMember ? 'ચૂકવેલ (Paid)' : feePaymentStatus,
        feeReceiptNumber: isTrustMember ? '' : feeReceiptNumber,
        feePaymentDate: isTrustMember ? '' : feePaymentDate,
        folioNumber: finalFolio,
        shareCount: finalShareCount,
        sharePrice: finalSharePrice,
        totalShareAmount: calculatedTotalShare,
        shareCertificateNo: finalCert
      });
      alert(`✓ ${isTrustMember ? 'ટ્રસ્ટ હોદ્દેદાર/સભ્ય' : 'નવો સભાસદ'} "${nameGuj}" સફળતાપૂર્વક નોંધાઈ ગયો.`);
    }

    setShowMemberModal(false);
  };

  // --- SHARE PURCHASE HANDLERS ---
  const handleOpenAddShare = () => {
    if (members.length === 0) {
      alert('શેર ફાળવણી માટે પહેલા ઓછામાં ઓછો એક સભાસદ રજીસ્ટર કરવો જરૂરી છે.');
      return;
    }
    const firstMember = members[0];
    setSelectedShareMemberId(firstMember.id);
    setNewShareFolioNo(firstMember.folioNumber || `FOLIO-00${firstMember.id}`);
    setNewShareCertNo(`CERT-${new Date().getFullYear()}-S${sharePurchases.length + 1}`);
    setNewShareCount(10);
    setNewSharePrice(100);
    setNewShareDate(new Date().toISOString().split('T')[0]);
    setNewSharePaymentMode('બેંક ટ્રાન્સફર (Bank)');
    setNewShareRemarks('નવા શેર ખરીદી અને મૂડી ફાળવણી');
    setShowShareModal(true);
  };

  const handleMemberSelectForShare = (mId: string) => {
    setSelectedShareMemberId(mId);
    const m = members.find(mem => mem.id === mId);
    if (m) {
      setNewShareFolioNo(m.folioNumber || `FOLIO-00${m.id}`);
    }
  };

  const handleSaveSharePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = members.find(m => m.id === selectedShareMemberId);
    if (!targetMember) {
      alert('કૃપા કરીને સભાસદ પસંદ કરો.');
      return;
    }

    const calculatedTotal = newShareCount * newSharePrice;

    if (onAddSharePurchase) {
      onAddSharePurchase({
        memberId: targetMember.id,
        memberNameGuj: targetMember.nameGuj,
        folioNumber: newShareFolioNo,
        certificateNo: newShareCertNo,
        date: newShareDate,
        shareCount: newShareCount,
        sharePrice: newSharePrice,
        totalAmount: calculatedTotal,
        paymentMode: newSharePaymentMode,
        remarksGuj: newShareRemarks
      });
      alert(`✓ સભાસદ "${targetMember.nameGuj}" ને ${newShareCount} નવા શેર સફળતાપૂર્વક ફાળવ્યા.`);
    }

    setShowShareModal(false);
  };

  // --- LOAN APPLICATION HANDLERS ---
  const handleOpenAddLoan = () => {
    if (members.length === 0) {
      alert('બેંક લોન ભલામણ માટે સભાસદ રજીસ્ટર હોવો જરૂરી છે.');
      return;
    }
    const firstMember = members[0];
    setEditingLoan(null);
    setLoanAppNo(`LN-${new Date().getFullYear()}-00${loanApplications.length + 1}`);
    setLoanAppDate(new Date().toISOString().split('T')[0]);
    setLoanMemberId(firstMember.id);
    setBankNameGuj('ધી સુરત ડિસ્ટ્રિક્ટ કો-ઓપરેટિવ બેંક લી.');
    setBranchGuj('મુખ્ય શાખા');
    setLoanTypeGuj('ખેતી વિષયક ધિરાણ (Agricultural Loan)');
    setRequestedAmount(100000);
    setRecommendedAmount(100000);
    setLoanPurposeGuj('ખેતી પાક ધિરાણ અને ઓજારો ખરીદી અર્થે');
    setGuarantor1NameGuj(members[1]?.nameGuj || '');
    setGuarantor2NameGuj(members[2]?.nameGuj || '');
    setLoanStatusGuj('ભલામણ મંજૂર / NOC ઇશ્યુ (Recommended & NOC Issued)');
    setRecommendationLetterNo(`NOC-${new Date().getFullYear()}-00${loanApplications.length + 1}`);
    setLoanApprovalDate(new Date().toISOString().split('T')[0]);
    setLoanRemarksGuj('કારોબારી કમિટીના ઠરાવ મુજબ ભલામણ પત્રક મંજૂર કરેલ છે.');
    setShowLoanModal(true);
  };

  const handleOpenEditLoan = (loan: MemberLoanApplication) => {
    setEditingLoan(loan);
    setLoanAppNo(loan.applicationNo);
    setLoanAppDate(loan.date);
    setLoanMemberId(loan.memberId);
    setBankNameGuj(loan.bankNameGuj);
    setBranchGuj(loan.branchGuj);
    setLoanTypeGuj(loan.loanTypeGuj);
    setRequestedAmount(loan.requestedAmount);
    setRecommendedAmount(loan.recommendedAmount);
    setLoanPurposeGuj(loan.purposeGuj);
    setGuarantor1NameGuj(loan.guarantor1NameGuj || '');
    setGuarantor2NameGuj(loan.guarantor2NameGuj || '');
    setLoanStatusGuj(loan.statusGuj);
    setRecommendationLetterNo(loan.recommendationLetterNo || `NOC-${new Date().getFullYear()}-001`);
    setLoanApprovalDate(loan.approvalDate || loan.date);
    setLoanRemarksGuj(loan.remarksGuj || '');
    setShowLoanModal(true);
  };

  const handleSaveLoanApplication = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = members.find(m => m.id === loanMemberId);
    if (!targetMember) {
      alert('કૃપા કરીને સભાસદ પસંદ કરો.');
      return;
    }

    if (editingLoan && onEditLoanApplication) {
      onEditLoanApplication({
        ...editingLoan,
        applicationNo: loanAppNo,
        date: loanAppDate,
        memberId: targetMember.id,
        memberNameGuj: targetMember.nameGuj,
        memberNo: targetMember.memberNo,
        folioNumber: targetMember.folioNumber,
        bankNameGuj,
        branchGuj,
        loanTypeGuj,
        requestedAmount,
        recommendedAmount,
        purposeGuj: loanPurposeGuj,
        guarantor1NameGuj,
        guarantor2NameGuj,
        statusGuj: loanStatusGuj,
        recommendationLetterNo,
        approvalDate: loanApprovalDate,
        remarksGuj: loanRemarksGuj
      });
      alert(`✓ બેંક લોન ભલામણ અરજી ${loanAppNo} ની વિગતો અપડેટ થઈ.`);
    } else if (onAddLoanApplication) {
      onAddLoanApplication({
        applicationNo: loanAppNo,
        date: loanAppDate,
        memberId: targetMember.id,
        memberNameGuj: targetMember.nameGuj,
        memberNo: targetMember.memberNo,
        folioNumber: targetMember.folioNumber,
        bankNameGuj,
        branchGuj,
        loanTypeGuj,
        requestedAmount,
        recommendedAmount,
        purposeGuj: loanPurposeGuj,
        guarantor1NameGuj,
        guarantor2NameGuj,
        statusGuj: loanStatusGuj,
        recommendationLetterNo,
        approvalDate: loanApprovalDate,
        remarksGuj: loanRemarksGuj
      });
      alert(`✓ સભાસદ "${targetMember.nameGuj}" ની બેંક લોન ભલામણ અરજી અને NOC સફળતાપૂર્વક નોંધાયા.`);
    }

    setShowLoanModal(false);
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800';
  const textMuted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              {categoryFilter === 'trust' || viewMode === 'trust' ? (
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              ) : (
                <Users className="w-5 h-5" />
              )}
            </span>
            <h2 className="text-xl font-black">
              {categoryFilter === 'trust' || viewMode === 'trust'
                ? 'ટ્રસ્ટ હોદ્દેદારો & કમિટી સભ્યો (Trust Board)'
                : categoryFilter === 'sabhasad' || viewMode === 'sabhasad'
                ? 'સભાસદો & શેરહોલ્ડર્સ રજીસ્ટર (Sabhasads)'
                : 'સભાસદો & ટ્રસ્ટ સભ્યો મોડ્યુલ'}
            </h2>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            {categoryFilter === 'trust' || viewMode === 'trust'
              ? 'ટ્રસ્ટીઓ, પ્રમુખશ્રી, મંત્રીશ્રી, ખજાનચી અને કમિટી સભ્યોનું ડિજિટલ રજીસ્ટર. (નોંધ: ટ્રસ્ટ સભ્યો માટે પ્રવેશ ફી કે શેર લાગુ પડતા નથી).'
              : categoryFilter === 'sabhasad' || viewMode === 'sabhasad'
              ? 'મંડળી/સોસાયટીના સભાસદોની માહિતી, પ્રવેશ ફી, શેર ખરીદી અને બેંક લોન NOC સંચાલન.'
              : 'સભાસદ ફી સ્વીકાર, શેર મૂડી ખરીદી ફાળવણી, અને સહકારી બેંક લોન મંજૂરી માટે ના-વાંધા પ્રમાણપત્ર (NOC) સંચાલન.'}
          </p>
        </div>

        {/* Action Buttons Depending on Active SubTab */}
        <div className="flex flex-wrap gap-2">
          {activeSubTab === 'members' && currentUser.role === 'Admin' && (
            <button
              onClick={handleOpenAddMember}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {categoryFilter === 'trust' || viewMode === 'trust'
                ? 'નવો ટ્રસ્ટ સભ્ય / હોદ્દેદાર ઉમેરો'
                : categoryFilter === 'sabhasad' || viewMode === 'sabhasad'
                ? 'નવો સભાસદ ઉમેરો'
                : 'નવો સભાસદ / સભ્ય ઉમેરો'}
            </button>
          )}

          {activeSubTab === 'shares' && currentUser.role === 'Admin' && (
            <button
              onClick={handleOpenAddShare}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> નવા શેર ખરીદી / ફાળવણી (Issue Shares)
            </button>
          )}

          {activeSubTab === 'loans' && currentUser.role === 'Admin' && (
            <button
              onClick={handleOpenAddLoan}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> નવી બેંક લોન ભલામણ અરજી (Bank Loan NOC)
            </button>
          )}
        </div>
      </div>

      {/* SubTab Navigation Bar */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-2 pb-1">
        <button
          onClick={() => setActiveSubTab('members')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'members'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          {viewMode === 'trust' ? 'ટ્રસ્ટ હોદ્દેદારો રજીસ્ટર' : viewMode === 'sabhasad' ? 'સભાસદ રજીસ્ટર અને પ્રવેશ ફી' : 'સભાસદ/સભ્ય રજીસ્ટર'}
        </button>

        {viewMode !== 'trust' && (
          <>
            <button
              onClick={() => setActiveSubTab('shares')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeSubTab === 'shares'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" /> શેર ભાંડોળ અને શેર ખરીદી ({totalIssuedShares} શેર)
            </button>

            <button
              onClick={() => setActiveSubTab('loans')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeSubTab === 'loans'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" /> બેંક લોન મંજૂરી અને NOC ({totalLoanAppsCount})
            </button>
          </>
        )}

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'reports'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          {viewMode === 'trust' ? 'ટ્રસ્ટ હોદ્દેદારો નામાવલી રીપોર્ટ' : 'સભાસદ નામાવલી રીપોર્ટ'}
        </button>
      </div>

      {/* --- TAB 1: MEMBERS DIRECTORY & FEES --- */}
      {activeSubTab === 'members' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {viewMode === 'trust' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
                <div>
                  <p className={`text-[11px] font-bold ${textMuted}`}>ટ્રસ્ટ હોદ્દેદારો & કમિટી</p>
                  <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{trustBoardMembers.length} સભ્યો</h3>
                </div>
                <span className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
                  <ShieldCheck className="w-6 h-6" />
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
                <div>
                  <p className={`text-[11px] font-bold ${textMuted}`}>મુખ્ય ટ્રસ્ટીઓ / પ્રમુખશ્રી</p>
                  <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {trustBoardMembers.filter(m => m.roleGuj.includes('ટ્રસ્ટી') || m.roleGuj.includes('પ્રમુખ')).length} હોદ્દેદારો
                  </h3>
                </div>
                <span className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
                  <UserCheck className="w-6 h-6" />
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
                <div>
                  <p className={`text-[11px] font-bold ${textMuted}`}>મંત્રી / કમિટી સભ્યો</p>
                  <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {trustBoardMembers.filter(m => !m.roleGuj.includes('પ્રમુખ') && !m.roleGuj.includes('ટ્રસ્ટી')).length} સભ્યો
                  </h3>
                </div>
                <span className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                  <Users className="w-6 h-6" />
                </span>
              </div>
            </div>
          ) : viewMode === 'sabhasad' ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
                <div>
                  <p className={`text-[11px] font-bold ${textMuted}`}>કુલ સભાસદો (Sabhasad)</p>
                  <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{sabhasadMembers.length} સભાસદ</h3>
                </div>
                <span className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                  <Users className="w-6 h-6" />
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
                <div>
                  <p className={`text-[11px] font-bold ${textMuted}`}>પ્રવેશ ફી ભરેલ સભાસદો</p>
                  <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalPaidMembers} સભ્યો</h3>
                </div>
                <span className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
                  <CheckCircle2 className="w-6 h-6" />
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
                <div>
                  <p className={`text-[11px] font-bold ${textMuted}`}>એકત્રિત પ્રવેશ ફી આવક</p>
                  <h3 className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 font-mono">
                    ₹ {totalEntryFeesCollected.toLocaleString('en-IN')}
                  </h3>
                </div>
                <span className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-600">
                  <DollarSign className="w-6 h-6" />
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
                <div>
                  <p className={`text-[11px] font-bold ${textMuted}`}>કુલ શેર મૂડી ફાળવણી</p>
                  <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                    ₹ {totalSabhasadShareAmount.toLocaleString('en-IN')}
                  </h3>
                </div>
                <span className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
                  <CreditCard className="w-6 h-6" />
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
                <div>
                  <p className={`text-[11px] font-bold ${textMuted}`}>સભાસદો (Sabhasad)</p>
                  <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{sabhasadMembers.length} સભાસદ</h3>
                </div>
                <span className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                  <Users className="w-6 h-6" />
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
                <div>
                  <p className={`text-[11px] font-bold ${textMuted}`}>ટ્રસ્ટ હોદ્દેદારો & કમિટી</p>
                  <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{trustBoardMembers.length} સભ્યો</h3>
                </div>
                <span className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
                  <ShieldCheck className="w-6 h-6" />
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
                <div>
                  <p className={`text-[11px] font-bold ${textMuted}`}>પ્રવેશ ફી ભરેલ સભ્યો</p>
                  <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalPaidMembers} સભ્યો</h3>
                </div>
                <span className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
                  <CheckCircle2 className="w-6 h-6" />
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
                <div>
                  <p className={`text-[11px] font-bold ${textMuted}`}>એકત્રિત પ્રવેશ ફી આવક</p>
                  <h3 className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 font-mono">
                    ₹ {totalEntryFeesCollected.toLocaleString('en-IN')}
                  </h3>
                </div>
                <span className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-600">
                  <DollarSign className="w-6 h-6" />
                </span>
              </div>
            </div>
          )}

          {/* Filter Pills & Search Bar */}
          <div className={`p-4 rounded-2xl border ${cardBg} space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> વર્ગીકરણ ફિલ્ટર:
                </span>
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  બધા સભ્યો ({members.length})
                </button>
                <button
                  onClick={() => setCategoryFilter('sabhasad')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    categoryFilter === 'sabhasad'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> સભાસદો ({sabhasadMembers.length})
                </button>
                <button
                  onClick={() => setCategoryFilter('trust')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    categoryFilter === 'trust'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> ટ્રસ્ટ / કમિટી હોદ્દેદારો ({trustBoardMembers.length})
                </button>
                {staffMembers.length > 0 && (
                  <button
                    onClick={() => setCategoryFilter('staff')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      categoryFilter === 'staff'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    કર્મચારી / અન્ય ({staffMembers.length})
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400 font-bold">
                બતાવી રહ્યા છે: {filteredMembers.length} {viewMode === 'trust' ? 'ટ્રસ્ટ સભ્યો' : 'સભાસદો'}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={viewMode === 'trust' ? "ટ્રસ્ટ હોદ્દેદારનું નામ, આઇડી, હોદ્દો કે ફોન નં. થી શોધો..." : "સભાસદનું નામ, નંબર, ફોલિયો નં. અથવા હોદ્દા થી શોધો..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs outline-none"
              />
            </div>
          </div>

          {/* Members Table */}
          <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-sm`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">
                      {viewMode === 'trust' ? 'આઇડી / સભ્ય નંબર' : 'સભ્ય નંબર / ફોલિયો'}
                    </th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">
                      {viewMode === 'trust' ? 'હોદ્દાનું નામ અને સ્થાન' : 'નામ અને શ્રેણી/હોદ્દો'}
                    </th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">સંપર્ક અને સરનામું</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">જોડાવાની તારીખ</th>
                    {viewMode !== 'trust' ? (
                      <>
                        <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-right">પ્રવેશ ફી</th>
                        <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-right">શેર વિગત</th>
                      </>
                    ) : (
                      <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-center">સભ્યપદ વર્ગ</th>
                    )}
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-center">ક્રિયા</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={viewMode === 'trust' ? 6 : 7} className="p-8 text-center text-xs text-slate-400">
                        {viewMode === 'trust' ? 'કોઈ ટ્રસ્ટ હોદ્દેદાર કે સભ્ય મળ્યા નથી.' : 'કોઈ સભાસદ મળ્યા નથી.'}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map(m => {
                      const catKey = getMemberCategoryKey(m);
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                          <td className="p-3.5 text-xs font-mono">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">{m.memberNo || `M-${m.id}`}</span>
                            {viewMode !== 'trust' && <span className="text-[10px] text-slate-400 block">{m.folioNumber || 'ફોલિયો નથી'}</span>}
                          </td>
                          <td className="p-3.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{m.nameGuj}</span>
                            {catKey === 'trust' ? (
                              <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 dark:bg-amber-950/70 dark:text-amber-200">
                                <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                {m.roleGuj}
                              </span>
                            ) : catKey === 'sabhasad' ? (
                              <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/70 dark:text-emerald-200">
                                <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                {m.roleGuj}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {m.roleGuj}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-xs">
                            {m.phone && <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400"><Phone className="w-3 h-3 text-slate-400" /> {m.phone}</div>}
                            {m.addressGuj && <div className="text-[10px] text-slate-400 truncate max-w-xs">{m.addressGuj}</div>}
                          </td>
                          <td className="p-3.5 text-xs font-mono text-slate-600 dark:text-slate-400">{m.joiningDate}</td>
                          {viewMode !== 'trust' ? (
                            <>
                              <td className="p-3.5 text-right font-mono">
                                <span className="text-xs font-bold text-emerald-600 block">₹ {(m.membershipFee || 0).toLocaleString('en-IN')}</span>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  m.feePaymentStatus === 'ચૂકવેલ (Paid)'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}>
                                  {m.feePaymentStatus || 'ચૂકવેલ (Paid)'}
                                </span>
                              </td>
                              <td className="p-3.5 text-right font-mono">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{m.shareCount || 0} શેર</span>
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-bold">
                                  ₹ {(m.totalShareAmount || 0).toLocaleString('en-IN')}
                                </span>
                              </td>
                            </>
                          ) : (
                            <td className="p-3.5 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                ટ્રસ્ટ હોદ્દેદાર
                              </span>
                            </td>
                          )}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {viewMode !== 'trust' && (
                                <button
                                  onClick={() => setSelectedFeeMember(m)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg"
                                  title="પ્રવેશ ફી પહોંચ જુઓ/પ્રિન્ટ કરો"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              )}
                            {currentUser.role === 'Admin' && (
                              <>
                                <button
                                  onClick={() => handleOpenEditMember(m)}
                                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-lg"
                                  title="પ્રોફાઇલ અને હિસાબ સુધારો"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {onDeleteMember && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`શું તમે ખરેખર સભાસદ "${m.nameGuj}" ને હટાવવા માંગો છો?`)) {
                                        onDeleteMember(m.id);
                                      }
                                    }}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg"
                                    title="સભાસદ રદ કરો"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: SHARE CAPITAL & SHARE PURCHASES --- */}
      {activeSubTab === 'shares' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <p className={`text-[11px] font-bold ${textMuted}`}>કુલ શેરધારક સભાસદો</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalShareholdersCount} સભાસદ</h3>
              </div>
              <span className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                <Users className="w-6 h-6" />
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <p className={`text-[11px] font-bold ${textMuted}`}>કુલ ઇશ્યુ કરેલ શેર</p>
                <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">{totalIssuedShares} શેર</h3>
              </div>
              <span className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
                <CreditCard className="w-6 h-6" />
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <p className={`text-[11px] font-bold ${textMuted}`}>એકત્રિત શેર મૂડી ભાંડોળ</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  ₹ {totalShareCapitalAmount.toLocaleString('en-IN')}
                </h3>
              </div>
              <span className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                <PieChart className="w-6 h-6" />
              </span>
            </div>
          </div>

          {/* Share Purchase Ledger Table */}
          <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-sm`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" /> સભાસદ શેર ખરીદી અને ફાળવણી રજીસ્ટર (Share Capital Register)
              </h3>
              {currentUser.role === 'Admin' && (
                <button
                  onClick={handleOpenAddShare}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> નવા શેર ફાળવો
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">તારીખ</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">સભાસદનું નામ</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">ફોલિયો નં.</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">સર્ટિફિકેટ ક્રમાંક</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-right">શેર સંખ્યા</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-right">શેર કિંમત</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-right">કુલ મૂડી</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-center">ક્રિયા</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredShares.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                        કોઈ અલગ શેર ખરીદી નોંધ મળી નથી. સભાસદ રજીસ્ટ્રેશન વખતે જ સભાસદના શેર રજીસ્ટર થાય છે.
                      </td>
                    </tr>
                  ) : (
                    filteredShares.map(s => {
                      const member = members.find(m => m.id === s.memberId) || ({ nameGuj: s.memberNameGuj, id: s.memberId, roleGuj: 'સભાસદ / શેરહોલ્ડર (Member / Shareholder)' } as unknown as TrustMember);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                          <td className="p-3.5 text-xs font-mono text-slate-600 dark:text-slate-400">{s.date}</td>
                          <td className="p-3.5 text-xs font-bold text-slate-800 dark:text-slate-100">{s.memberNameGuj}</td>
                          <td className="p-3.5 text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">{s.folioNumber}</td>
                          <td className="p-3.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{s.certificateNo}</td>
                          <td className="p-3.5 text-xs text-right font-mono font-bold text-slate-800 dark:text-slate-100">{s.shareCount} શેર</td>
                          <td className="p-3.5 text-xs text-right font-mono text-slate-600 dark:text-slate-400">₹ {s.sharePrice}</td>
                          <td className="p-3.5 text-xs text-right font-mono font-bold text-emerald-600">₹ {s.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedShareCertData({ member, purchase: s })}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                title="શેર સર્ટિફિકેટ જુઓ/પ્રિન્ટ કરો"
                              >
                                <Award className="w-3.5 h-3.5" /> સર્ટિફિકેટ
                              </button>
                              {onDeleteSharePurchase && currentUser.role === 'Admin' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm('શું તમે આ શેર ફાળવણી રદ કરવા માંગો છો?')) {
                                      onDeleteSharePurchase(s.id);
                                    }
                                  }}
                                  className="p-1.5 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg"
                                  title="રદ કરો"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: EXTERNAL BANK LOAN APPROVALS & NOC RECOMMENDATION --- */}
      {activeSubTab === 'loans' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <p className={`text-[11px] font-bold ${textMuted}`}>કુલ બેંક ધિરાણ અરજીઓ</p>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalLoanAppsCount} અરજી</h3>
              </div>
              <span className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">
                <Building2 className="w-6 h-6" />
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <p className={`text-[11px] font-bold ${textMuted}`}>કુલ મંજૂર / લીધેલી લોન</p>
                <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                  ₹ {totalGenSanctionedAmt.toLocaleString('en-IN')}
                </h3>
              </div>
              <span className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
                <ShieldCheck className="w-6 h-6" />
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <p className={`text-[11px] font-bold ${textMuted}`}>કુલ વસૂલ / જમા હપ્તા (મુદ્દલ)</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  ₹ {totalGenPrincipalPaid.toLocaleString('en-IN')}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">જમા વ્યાજ: ₹ {totalGenInterestPaid.toLocaleString('en-IN')}</p>
              </div>
              <span className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between`}>
              <div>
                <p className={`text-[11px] font-bold ${textMuted}`}>કુલ બાકી લોન રકમ</p>
                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
                  ₹ {totalGenRemainingBal.toLocaleString('en-IN')}
                </h3>
              </div>
              <span className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600">
                <DollarSign className="w-6 h-6" />
              </span>
            </div>
          </div>

          {/* Loan Applications Table */}
          <div className={`rounded-2xl border ${cardBg} overflow-hidden shadow-sm`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" /> સભાસદ બેંક લોન ભલામણ પત્રક રજીસ્ટર (Bank Loan Recommendation & NOC Register)
                </h3>
                <p className="text-[11px] text-slate-400">
                  સભાસદને સહકારી કે રાષ્ટ્રીયકૃત બેંકમાંથી લોન મંજૂર કરાવવા માટે સંસ્થા તરફથી આપવામાં આવતું ના-વાંધા પ્રમાણપત્ર (NOC) અને ભલામણ પત્રક.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowGeneralLoanStatementModal(true)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  title="સભાસદોની તમામ લોન, જમા હપ્તા અને બાકી રકમનું પત્રક જુઓ/પ્રિન્ટ કરો"
                >
                  <FileText className="w-3.5 h-3.5" /> સામાન્ય લોન સ્ટેટમેન્ટ (General Loan Statement)
                </button>
                <button
                  onClick={handleOpenConsolidatedPatrak}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> સંયુક્ત બેંક લોન પત્રક (Bank Schedule)
                </button>
                {currentUser.role === 'Admin' && (
                  <button
                    onClick={handleOpenAddLoan}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> નવી લોન ભલામણ અરજી
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">અરજી અને NOC નં.</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">સભાસદનું નામ</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">બેંક અને શાખાનું નામ</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">લોનનો પ્રકાર અને હેતુ</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-right">માગેલી / ભલામણ રકમ</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-center">સ્થિતિ (Status)</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-center">ક્રિયા</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                        કોઈ બેંક લોન ભલામણ કે ચુકવણી અરજીઓ મળી નથી.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map(l => {
                      const sancAmt = l.sanctionedAmount || l.recommendedAmount || l.requestedAmount || 0;
                      const paidP = (l.repayments || []).reduce((sum, r) => sum + (r.principalPaid || 0), 0);
                      const remP = Math.max(0, sancAmt - paidP);
                      const isDisbursed = l.statusGuj.includes('ચુકવણી') || l.statusGuj.includes('Sanctioned');
                      const isClosed = l.statusGuj.includes('પૂર્ણ') || l.statusGuj.includes('Closed');

                      return (
                        <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                          <td className="p-3.5 text-xs font-mono">
                            <span className="font-bold text-amber-600 dark:text-amber-400 block">{l.applicationNo}</span>
                            <span className="text-[10px] text-slate-400 block">{l.recommendationLetterNo || 'NOC Pending'}</span>
                            {l.sanctionLetterNo && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">
                                મંજૂરી: {l.sanctionLetterNo}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{l.memberNameGuj}</span>
                            <span className="text-[10px] text-slate-400 font-mono">સભાસદ નં.: {l.memberNo || 'N/A'}</span>
                          </td>
                          <td className="p-3.5 text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block">{l.bankNameGuj}</span>
                            <span className="text-[10px] text-slate-400 block">{l.branchGuj}</span>
                          </td>
                          <td className="p-3.5 text-xs">
                            <span className="font-medium text-indigo-600 dark:text-indigo-400 block">{l.loanTypeGuj}</span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-xs">{l.purposeGuj}</span>
                          </td>
                          <td className="p-3.5 text-xs text-right font-mono">
                            <span className="text-slate-500 block text-[10px]">માગેલી: ₹ {l.requestedAmount.toLocaleString('en-IN')}</span>
                            <span className="font-bold text-emerald-600 block text-xs">
                              મંજૂર: ₹ {sancAmt.toLocaleString('en-IN')}
                            </span>
                            {(isDisbursed || isClosed) && (
                              <div className="mt-0.5 text-[10px] leading-tight border-t border-slate-200 dark:border-slate-800 pt-0.5">
                                <span className="text-slate-500 block">વસૂલ: ₹ {paidP.toLocaleString('en-IN')}</span>
                                <span className={`font-bold block ${remP > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  બાકી: ₹ {remP.toLocaleString('en-IN')}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold block whitespace-nowrap ${
                              isClosed
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                : isDisbursed
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : l.statusGuj.includes('ના-મંજૂર')
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                : l.statusGuj.includes('ભલામણ')
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            }`}>
                              {l.statusGuj}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              {/* NOC Printable */}
                              <button
                                onClick={() => setSelectedLoanCertData(l)}
                                className="p-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                title="ભલામણ પત્રક / NOC પ્રમાણપત્ર પ્રિન્ટ કરો"
                              >
                                <Printer className="w-3 h-3" /> NOC
                              </button>

                              {/* Disbursement Sanction Record Button */}
                              {currentUser.role === 'Admin' && (
                                <button
                                  onClick={() => handleOpenDisbursement(l)}
                                  className="p-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                  title="બેંક મંજૂરી અને ચુકવણી નોંધો"
                                >
                                  <Building2 className="w-3 h-3" /> બેંક મંજૂરી નોંધ
                                </button>
                              )}

                              {/* Installment Repayment Collection Button */}
                              {(isDisbursed || isClosed) && currentUser.role === 'Admin' && (
                                <button
                                  onClick={() => handleOpenRepayment(l)}
                                  className="p-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                  title="હપ્તો ભરો / વસૂલાત કરો"
                                >
                                  <Plus className="w-3 h-3" /> હપ્તો ભરો ({l.repayments?.length || 0})
                                </button>
                              )}

                              {/* Member Loan Ledger Statement Printable */}
                              {(isDisbursed || isClosed) && (
                                <button
                                  onClick={() => setSelectedLoanLedgerData(l)}
                                  className="p-1 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                  title="સભાસદ લોન ખાતા ખાતાવહી સ્ટેટમેન્ટ"
                                >
                                  <FileText className="w-3 h-3" /> સ્ટેટમેન્ટ
                                </button>
                              )}

                              {/* Disbursement Advice Voucher Printable */}
                              {isDisbursed && (
                                <button
                                  onClick={() => setSelectedDisbursementAdviceData(l)}
                                  className="p-1 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                  title="બેંક ચુકવણી સલાહ પત્રક / Voucher"
                                >
                                  <ShieldCheck className="w-3 h-3" /> વાઉચર
                                </button>
                              )}

                              {currentUser.role === 'Admin' && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditLoan(l)}
                                    className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg"
                                    title="સ્થિતિ કે વિગત સુધારો"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {onDeleteLoanApplication && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`શું તમે લોન અરજી "${l.applicationNo}" રદ કરવા માંગો છો?`)) {
                                          onDeleteLoanApplication(l.id);
                                        }
                                      }}
                                      className="p-1 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg"
                                      title="રદ કરો"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: PRINTABLE REPORTS (SABHASAD REGISTER & GENERAL LOAN STATEMENT) --- */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          {/* Report Switcher */}
          <div className={`p-4 rounded-2xl border ${cardBg} flex flex-wrap items-center justify-between gap-3 print:hidden`}>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedReportType('members')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  selectedReportType === 'members'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Users className="w-4 h-4" /> સભાસદ નામાવલી & શેર મૂડી રજીસ્ટર
              </button>
              <button
                onClick={() => setSelectedReportType('generalLoanStatement')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  selectedReportType === 'generalLoanStatement'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" /> સભાસદ સામાન્ય લોન / ધિરાણ સ્ટેટમેન્ટ
              </button>
            </div>
          </div>

          {selectedReportType === 'members' ? (
            <div id="printable-sabhasad-register-container" className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              {/* Formal Trust Header */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-750 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                      <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">
                        {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'} | નોંધણી નં: <span className="font-mono font-bold">{trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 print:hidden">
                    <button
                      onClick={() => handleDownloadPDF('printable-sabhasad-register-container', 'Sabhasad_Master_Register')}
                      disabled={isGeneratingPDF}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF ડાઉનલોડ
                    </button>
                    <button
                      onClick={() => printContainer('printable-sabhasad-register-container')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ રિપોર્ટ
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span className="font-bold">દસ્તાવેજ: સભાસદ નામાવલી, શેર મૂડી અને પ્રવેશ ફી રજીસ્ટર</span>
                  <span>તા.: {new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Master Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">સભાસદ ક્રમાંક</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">સભાસદનું પૂરું નામ</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">હોદ્દો / શ્રેણી</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">જોડાવાની તા.</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">મોબાઈલ નંબર</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right">પ્રવેશ ફી (₹)</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">ફોલિયો નં.</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right">શેર સંખ્યા</th>
                      <th className="p-2.5 text-right">શેર મૂડી (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {members.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-indigo-600">{m.memberNo || `M-${m.id}`}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-bold">{m.nameGuj}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">{m.roleGuj}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-mono">{m.joiningDate}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-mono">{m.phone || '-'}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-emerald-600">₹ {(m.membershipFee || 0).toLocaleString('en-IN')}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-mono">{m.folioNumber || '-'}</td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono font-bold">{m.shareCount || 0}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">₹ {(m.totalShareAmount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-bold border-t border-slate-300 dark:border-slate-700">
                      <td colSpan={5} className="p-2.5 text-right border-r border-slate-200 dark:border-slate-800 uppercase">કુલ સરવાળો (Total):</td>
                      <td className="p-2.5 text-right font-mono text-emerald-600 border-r border-slate-200 dark:border-slate-800">₹ {totalEntryFeesCollected.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800"></td>
                      <td className="p-2.5 text-right font-mono border-r border-slate-200 dark:border-slate-800">{totalIssuedShares} શેર</td>
                      <td className="p-2.5 text-right font-mono text-emerald-600">₹ {totalShareCapitalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div id="printable-general-loan-statement-report-view" className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 text-slate-900 dark:text-slate-100">
                {/* Formal Trust Header */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-750 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                        <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">
                          {trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'} | નોંધણી નં: <span className="font-mono font-bold">{trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'}</span>
                        </p>
                      </div>
                    </div>
                  <div className="flex gap-2 print:hidden">
                    <button
                      onClick={() => handleDownloadPDF('printable-general-loan-statement-report-view', 'Sabhasad_General_Loan_Statement_Report')}
                      disabled={isGeneratingPDF}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF ડાઉનલોડ
                    </button>
                    <button
                      onClick={() => printContainer('printable-general-loan-statement-report-view')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ સ્ટેટમેન્ટ
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span className="font-bold">દસ્તાવેજ: સભાસદ સામાન્ય લોન / ધિરાણ અને વસૂલાત વાર્ષિક સ્ટેટમેન્ટ</span>
                  <span>તા.: {new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Financial KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center font-mono text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans">કુલ લોનધારક સભાસદો</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">{generalFilteredLoans.length} સભાસદ</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans">કુલ લીધેલી / મંજૂર લોન</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">₹ {totalGenSanctionedAmt.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans">કુલ જમા થયેલ હપ્તા (મુદ્દલ)</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₹ {totalGenPrincipalPaid.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans">કુલ બાકી લોન રકમ</span>
                  <span className={`font-black text-sm ${totalGenRemainingBal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    ₹ {totalGenRemainingBal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Master Statement Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center">ક્રમ</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">સભાસદ નં. & નામ</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">બેંક & લોન પ્રકાર</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right">મંજૂર/લીધેલી લોન (₹)</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right">જમા હપ્તા (મુદ્દલ) (₹)</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right">જમા વ્યાજ (₹)</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right">કુલ જમા રકમ (₹)</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right">બાકી લોન રકમ (₹)</th>
                      <th className="p-2.5 text-center">સ્થિતિ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {generalFilteredLoans.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                          કોઈ સભાસદ લોન રેકોર્ડ મળેલ નથી.
                        </td>
                      </tr>
                    ) : (
                      generalFilteredLoans.map((l, index) => {
                        const sancAmt = l.sanctionedAmount || l.recommendedAmount || l.requestedAmount || 0;
                        const paidP = (l.repayments || []).reduce((sum, r) => sum + (r.principalPaid || 0), 0);
                        const paidI = (l.repayments || []).reduce((sum, r) => sum + (r.interestPaid || 0), 0);
                        const totalPaid = paidP + paidI;
                        const remBal = Math.max(0, sancAmt - paidP);

                        return (
                          <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center font-mono font-bold">{index + 1}</td>
                            <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                              <span className="font-bold text-slate-900 dark:text-slate-100 block">{l.memberNameGuj}</span>
                              <span className="text-[10px] text-slate-400 font-mono">સભાસદ નં.: {l.memberNo || 'N/A'}</span>
                            </td>
                            <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 block">{l.bankNameGuj}</span>
                              <span className="text-[10px] text-slate-400 block">{l.loanTypeGuj} ({l.applicationNo})</span>
                            </td>
                            <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                              ₹ {sancAmt.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              ₹ {paidP.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-indigo-600 dark:text-indigo-400">
                              ₹ {paidI.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                              ₹ {totalPaid.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                              ₹ {remBal.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                l.statusGuj.includes('પૂર્ણ') || l.statusGuj.includes('Closed')
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                  : remBal === 0 && paidP > 0
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}>
                                {l.statusGuj.includes('પૂર્ણ') ? 'ભરપાઈ થયેલ' : remBal === 0 && paidP > 0 ? 'ચૂકવેલ' : 'ચાલુ લોન'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 border-t border-slate-300 dark:border-slate-700">
                      <td colSpan={3} className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right uppercase">
                        કુલ સરવાળો (TOTAL):
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-indigo-600 dark:text-indigo-400">
                        ₹ {totalGenSanctionedAmt.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        ₹ {totalGenPrincipalPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-indigo-600 dark:text-indigo-400">
                        ₹ {totalGenInterestPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-slate-900 dark:text-slate-100">
                        ₹ {totalGenTotalPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-rose-600 dark:text-rose-400 font-black">
                        ₹ {totalGenRemainingBal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL 1: ADD / EDIT MEMBER MODAL --- */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-2xl rounded-2xl border ${cardBg} p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-indigo-600 flex items-center gap-2">
                {editingMember ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingMember ? 'સભ્ય/સભાસદ પ્રોફાઇલ અને વિગતો સુધારો' : 'નવું સભાસદ / ટ્રસ્ટ સભ્ય નોંધણી ફોર્મ'}
              </h3>
              <button onClick={() => setShowMemberModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">સભ્ય / સભાસદ નં. *</label>
                  <input
                    type="text"
                    value={memberNo}
                    onChange={e => setMemberNo(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold ${inputBg}`}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">પૂરું નામ *</label>
                  <input
                    type="text"
                    placeholder="દા.ત. નરેન્દ્રભાઈ કાંતિલાલ શાહ"
                    value={nameGuj}
                    onChange={e => setNameGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold ${inputBg}`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">સભ્ય વર્ગીકરણ (Member Type) *</label>
                  <select
                    value={memberCategory}
                    onChange={(e: any) => {
                      const cat = e.target.value as MemberCategory;
                      setMemberCategory(cat);
                      if (cat.includes('સભાસદ')) {
                        setRoleGuj('સભાસદ / શેરહોલ્ડર (Member / Shareholder)');
                      } else if (cat.includes('ટ્રસ્ટ')) {
                        setRoleGuj('ટ્રસ્ટી (Trustee)');
                      } else {
                        setRoleGuj('કર્મચારી (Employee)');
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold ${inputBg}`}
                  >
                    <option value="સભાસદ (Society Member)">સભાસદ (Society Sabhasad Member)</option>
                    <option value="ટ્રસ્ટ હોદ્દેદાર / કમિટી સભ્ય (Trustee / Board Member)">ટ્રસ્ટ હોદ્દેદાર / કમિટી સભ્ય (Trust Trustee/Board Member)</option>
                    <option value="કર્મચારી / અન્ય (Staff / Volunteer)">કર્મચારી / અન્ય (Staff / Volunteer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">હોદ્દો / શ્રેણી *</label>
                  <select
                    value={roleGuj}
                    onChange={(e: any) => setRoleGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  >
                    {memberCategory.includes('સભાસદ') ? (
                      <>
                        <option value="સભાસદ / શેરહોલ્ડર (Member / Shareholder)">સભાસદ / શેરહોલ્ડર (Member / Shareholder)</option>
                        <option value="સાધારણ સભાસદ (Ordinary Member)">સાધારણ સભાસદ (Ordinary Member)</option>
                        <option value="આજીવન સભાસદ (Life Member)">આજીવન સભાસદ (Life Member)</option>
                      </>
                    ) : memberCategory.includes('ટ્રસ્ટ') ? (
                      <>
                        <option value="પ્રમુખશ્રી (President)">પ્રમુખશ્રી (President)</option>
                        <option value="ઉપપ્રમુખ (Vice President)">ઉપપ્રમુખ (Vice President)</option>
                        <option value="મંત્રી / સેક્રેટરી (Secretary)">મંત્રી / સેક્રેટરી (Secretary)</option>
                        <option value="ખજાનચી (Treasurer)">ખજાનચી (Treasurer)</option>
                        <option value="ટ્રસ્ટી (Trustee)">ટ્રસ્ટી (Trustee)</option>
                        <option value="કમિટી સભ્ય (Committee Member)">કમિટી સભ્ય (Committee Member)</option>
                      </>
                    ) : (
                      <>
                        <option value="કર્મચારી (Employee)">કર્મચારી (Employee)</option>
                        <option value="સ્વયંસેવક (Volunteer)">સ્વયંસેવક (Volunteer)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">જોડાવાની તારીખ</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={e => setJoiningDate(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">મોબાઈલ નંબર</label>
                  <input
                    type="text"
                    placeholder="9825012345"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">ઈમેઈલ સરનામું</label>
                  <input
                    type="email"
                    placeholder="member@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">સરનામું</label>
                <textarea
                  rows={2}
                  placeholder="સભાસદનું રહેણાંક સરનામું"
                  value={addressGuj}
                  onChange={e => setAddressGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>

              {/* Fee & Share Sections - Only shown for Sabhasads, hidden for Trust Members */}
              {!memberCategory.includes('ટ્રસ્ટ') ? (
                <>
                  {/* Membership Fee Section */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-3">
                    <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> સભાસદ પ્રવેશ ફી / મંડળી સભ્યપદ ફી વિગત
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold mb-1">પ્રવેશ ફી રકમ (₹)</label>
                        <input
                          type="number"
                          value={membershipFee}
                          onChange={e => setMembershipFee(Number(e.target.value))}
                          className={`w-full p-2 rounded-lg text-xs font-mono font-bold ${inputBg}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold mb-1">ચૂકવણી પદ્ધતિ</label>
                        <select
                          value={feePaymentMode}
                          onChange={(e: any) => setFeePaymentMode(e.target.value)}
                          className={`w-full p-2 rounded-lg text-xs ${inputBg}`}
                        >
                          <option value="રોકડ (Cash)">રોકડ (Cash)</option>
                          <option value="બેંક ટ્રાન્સફર (Bank)">બેંક ટ્રાન્સફર (Bank)</option>
                          <option value="ચેક (Cheque)">ચેક (Cheque)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold mb-1">ફી સ્થિતિ</label>
                        <select
                          value={feePaymentStatus}
                          onChange={(e: any) => setFeePaymentStatus(e.target.value)}
                          className={`w-full p-2 rounded-lg text-xs ${inputBg}`}
                        >
                          <option value="ચૂકવેલ (Paid)">ચૂકવેલ (Paid)</option>
                          <option value="બાકી (Pending)">બાકી (Pending)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold block text-amber-900 dark:text-amber-100">ટ્રસ્ટ હોદ્દેદાર નોંધણી (કોઈ ફી નથી)</span>
                    ટ્રસ્ટના હોદ્દેદારો, ટ્રસ્ટીઓ અને કમિટી સભ્યો માટે સભાસદ પ્રવેશ ફી અથવા શેર બોજ ખરીદી લાગુ પડતી નથી.
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {editingMember ? 'અપડેટ કરો' : 'સભાસદ તરીકે નોંધો'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- MODAL 2: ADD SHARE PURCHASE MODAL --- */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg rounded-2xl border ${cardBg} p-6 shadow-2xl space-y-4`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-emerald-600 flex items-center gap-2">
                <Plus className="w-4 h-4" /> સભાસદને નવા શેર ફાળવણી ફોર્મ
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSharePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">સભાસદ પસંદ કરો *</label>
                <select
                  value={selectedShareMemberId}
                  onChange={e => handleMemberSelectForShare(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold ${inputBg}`}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nameGuj} ({m.memberNo || `M-${m.id}`} | ફોલિયો: {m.folioNumber || 'નથી'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">ફોલિયો નંબર</label>
                  <input
                    type="text"
                    value={newShareFolioNo}
                    onChange={e => setNewShareFolioNo(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">સર્ટિફિકેટ નં. *</label>
                  <input
                    type="text"
                    value={newShareCertNo}
                    onChange={e => setNewShareCertNo(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold ${inputBg}`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">નવા શેર સંખ્યા *</label>
                  <input
                    type="number"
                    value={newShareCount}
                    onChange={e => setNewShareCount(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold ${inputBg}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">ભાવ પ્રતિ શેર (₹)</label>
                  <input
                    type="number"
                    value={newSharePrice}
                    onChange={e => setNewSharePrice(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">કુલ રકમ (₹)</label>
                  <input
                    type="text"
                    value={`₹ ${(newShareCount * newSharePrice).toLocaleString('en-IN')}`}
                    disabled
                    className="w-full p-2.5 rounded-xl text-xs font-mono font-bold text-emerald-600 bg-slate-100 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">ફાળવણી તારીખ</label>
                  <input
                    type="date"
                    value={newShareDate}
                    onChange={e => setNewShareDate(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">ચૂકવણી પદ્ધતિ</label>
                  <select
                    value={newSharePaymentMode}
                    onChange={(e: any) => setNewSharePaymentMode(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  >
                    <option value="બેંક ટ્રાન્સફર (Bank)">બેંક ટ્રાન્સફર (Bank)</option>
                    <option value="રોકડ (Cash)">રોકડ (Cash)</option>
                    <option value="ચેક (Cheque)">ચેક (Cheque)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">નોંધ / રિમાર્ક્સ</label>
                <input
                  type="text"
                  placeholder="દા.ત. નવો શેર ખરીદી નોંઘ"
                  value={newShareRemarks}
                  onChange={e => setNewShareRemarks(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  શેર મંજૂર કરી ઉમેરો
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- MODAL 3: ADD / EDIT BANK LOAN RECOMMENDATION MODAL --- */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-2xl rounded-2xl border ${cardBg} p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-amber-600 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {editingLoan ? 'બેંક લોન અરજી અને NOC ની વિગત સુધારો' : 'નવી સહકારી બેંક લોન ભલામણ પત્રક અને NOC અરજી'}
              </h3>
              <button onClick={() => setShowLoanModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoanApplication} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">અરજી ક્રમાંક *</label>
                  <input
                    type="text"
                    value={loanAppNo}
                    onChange={e => setLoanAppNo(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold ${inputBg}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">અરજી તારીખ</label>
                  <input
                    type="date"
                    value={loanAppDate}
                    onChange={e => setLoanAppDate(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">ભલામણ NOC ક્રમાંક</label>
                  <input
                    type="text"
                    value={recommendationLetterNo}
                    onChange={e => setRecommendationLetterNo(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">લોન માગનાર સભાસદ *</label>
                <select
                  value={loanMemberId}
                  onChange={e => setLoanMemberId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold ${inputBg}`}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nameGuj} (સભાસદ નં.: {m.memberNo || `M-${m.id}`} | ફોલિયો: {m.folioNumber || 'નથી'} | શેર: {m.shareCount || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">બેંકનું નામ *</label>
                  <input
                    type="text"
                    placeholder="દા.ત. ધી સુરત ડિસ્ટ્રિક્ટ કો-ઓપરેટિવ બેંક લી."
                    value={bankNameGuj}
                    onChange={e => setBankNameGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold ${inputBg}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">બેંક શાખા (Branch)</label>
                  <input
                    type="text"
                    placeholder="મુખ્ય શાખા"
                    value={branchGuj}
                    onChange={e => setBranchGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">ધિરાણ / લોનનો પ્રકાર</label>
                  <select
                    value={loanTypeGuj}
                    onChange={(e: any) => setLoanTypeGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  >
                    <option value="ખેતી વિષયક ધિરાણ (Agricultural Loan)">ખેતી વિષયક ધિરાણ (Agricultural Loan)</option>
                    <option value="પશુપાલન / ડેરી ધિરાણ (Cattle/Dairy Loan)">પશુપાલન / ડેરી ધિરાણ (Cattle/Dairy Loan)</option>
                    <option value="વ્યવસાય ધિરાણ (Business Loan)">વ્યવસાય ધિરાણ (Business Loan)</option>
                    <option value="મકાન / ગૃહ નિર્માણ લોન (Home Loan)">મકાન / ગૃહ નિર્માણ લોન (Home Loan)</option>
                    <option value="વ્યક્તિગત લોન (Personal Loan)">વ્યક્તિગત લોન (Personal Loan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">માગેલી લોન રકમ (₹) *</label>
                  <input
                    type="number"
                    value={requestedAmount}
                    onChange={e => setRequestedAmount(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold ${inputBg}`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">ભલામણ કરેલ રકમ (₹) *</label>
                  <input
                    type="number"
                    value={recommendedAmount}
                    onChange={e => setRecommendedAmount(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold text-emerald-600 ${inputBg}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">લોનનો હેતુ / કારણ</label>
                <input
                  type="text"
                  placeholder="દા.ત. પાક ધિરાણ, ટ્રેક્ટર ખરીદી અથવા પશુપાલન વિકાસ અર્થે"
                  value={loanPurposeGuj}
                  onChange={e => setLoanPurposeGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">જામીનદાર સભાસદ ૧</label>
                  <input
                    type="text"
                    placeholder="જામીનદાર ૧ નું નામ"
                    value={guarantor1NameGuj}
                    onChange={e => setGuarantor1NameGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">જામીનદાર સભાસદ ૨</label>
                  <input
                    type="text"
                    placeholder="જામીનદાર ૨ નું નામ"
                    value={guarantor2NameGuj}
                    onChange={e => setGuarantor2NameGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">મંજૂરી સ્થિતિ (Approval Status)</label>
                  <select
                    value={loanStatusGuj}
                    onChange={(e: any) => setLoanStatusGuj(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold ${inputBg}`}
                  >
                    <option value="અરજી મળેલ (Pending)">અરજી મળેલ (Pending)</option>
                    <option value="ભલામણ મંજૂર / NOC ઇશ્યુ (Recommended & NOC Issued)">ભલામણ મંજૂર / NOC ઇશ્યુ (Recommended & NOC Issued)</option>
                    <option value="ના-મંજૂર (Rejected)">ના-મંજૂર (Rejected)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">મંજૂરી તારીખ</label>
                  <input
                    type="date"
                    value={loanApprovalDate}
                    onChange={e => setLoanApprovalDate(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-mono ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">ઠરાવ ક્રમાંક સંદર્ભ / રિમાર્ક્સ</label>
                <textarea
                  rows={2}
                  placeholder="દા.ત. કારોબારી સમિતિ બેઠક ઠરાવ ક્રમાંક ૪/૨૦૨૬ અન્વયે બેંક ધિરાણ માટે ના-વાંધા પ્રમાણપત્ર મંજૂર કરેલ છે."
                  value={loanRemarksGuj}
                  onChange={e => setLoanRemarksGuj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs ${inputBg}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {editingLoan ? 'અપડેટ કરો' : 'લોન ભલામણ પત્રક મંજૂર કરી સેવ કરો'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* --- PRINTABLE MODAL 1: MEMBER FEE RECEIPT --- */}
      {selectedFeeMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white text-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-indigo-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> સભાસદ પ્રવેશ ફી રસીદ પહોંચ
              </h3>
              <button onClick={() => setSelectedFeeMember(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Frame */}
            <div id="printable-member-fee-receipt" className="p-6 border-2 border-slate-800 rounded-xl space-y-4 bg-white">
              {/* Trust Header with Logo */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3 gap-4">
                <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center">
                  <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                </div>
                <div className="flex-1 text-center">
                  <h2 className="text-lg font-black text-indigo-900">{trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}</h2>
                  <p className="text-xs font-medium text-slate-600">{trustSettings?.addressGuj || 'ગુજરાત'}</p>
                  <p className="text-[11px] font-mono text-slate-500">નોંધણી નં.: {trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'}</p>
                </div>
                <div className="w-14 h-14 flex-shrink-0 opacity-0"></div>
              </div>
              <div className="text-center my-2">
                <div className="mt-2 inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-full uppercase">
                  સભાસદ પ્રવેશ ફી પહોંચ
                </div>
              </div>

              {/* Receipt Metadata */}
              <div className="flex justify-between text-xs font-mono border-b border-slate-200 pb-2">
                <div>પહોંચ ક્રમાંક: <span className="font-bold text-indigo-700">{selectedFeeMember.feeReceiptNumber || `FEE-${selectedFeeMember.id}`}</span></div>
                <div>તારીખ: <span className="font-bold">{selectedFeeMember.feePaymentDate || selectedFeeMember.joiningDate}</span></div>
              </div>

              {/* Member Details */}
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-3">
                  <span className="font-bold text-slate-500">સભાસદ ક્રમાંક:</span>
                  <span className="col-span-2 font-bold font-mono text-slate-900">{selectedFeeMember.memberNo || `M-${selectedFeeMember.id}`}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-bold text-slate-500">સભાસદનું પૂરું નામ:</span>
                  <span className="col-span-2 font-black text-indigo-950 text-sm">{selectedFeeMember.nameGuj}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-bold text-slate-500">હોદ્દો / શ્રેણી:</span>
                  <span className="col-span-2 font-bold text-slate-800">{selectedFeeMember.roleGuj}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-bold text-slate-500">સરનામું:</span>
                  <span className="col-span-2 text-slate-700">{selectedFeeMember.addressGuj || 'ગુજરાત'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-bold text-slate-500">ચૂકવણી પદ્ધતિ:</span>
                  <span className="col-span-2 font-bold text-slate-800">{selectedFeeMember.feePaymentMode || 'રોકડ (Cash)'}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-900">સ્વીકારેલ પ્રવેશ ફી રકમ:</span>
                <span className="text-base font-black font-mono text-emerald-700">₹ {(selectedFeeMember.membershipFee || 0).toLocaleString('en-IN')} /-</span>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end text-xs font-bold text-slate-700">
                <div className="text-center">
                  <div className="w-28 border-b border-slate-400 mb-1"></div>
                  <span>સભાસદની સહી</span>
                </div>
                <div className="text-center">
                  <div className="w-28 border-b border-slate-400 mb-1"></div>
                  <span>પ્રમુખ / મંત્રી / ટ્રસ્ટી સહી</span>
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleDownloadPDF('printable-member-fee-receipt', `Fee_Receipt_${selectedFeeMember.memberNo || selectedFeeMember.id}`)}
                disabled={isGeneratingPDF}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF ડાઉનલોડ
              </button>
              <button
                onClick={() => printContainer('printable-member-fee-receipt')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ પહોંચ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINTABLE MODAL 2: OFFICIAL SHARE CERTIFICATE --- */}
      {selectedShareCertData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-amber-700 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> અધિકૃત સભાસદ શેર પ્રમાણપત્ર (Official Share Certificate)
              </h3>
              <button onClick={() => setSelectedShareCertData(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Share Certificate Frame with Decorative Border */}
            <div id="printable-share-certificate" className="p-8 border-8 border-amber-600 rounded-2xl space-y-6 bg-gradient-to-b from-amber-50/40 to-white text-slate-900 relative">
              {/* Header with Logo */}
              <div className="flex items-center justify-between border-b border-amber-200 pb-3 gap-4">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-amber-800">અધિકૃત શેર મૂડી પ્રમાણપત્ર</p>
                  <h1 className="text-2xl font-black text-indigo-950">{trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}</h1>
                  <p className="text-xs font-medium text-slate-600">{trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'}</p>
                  <p className="text-xs font-mono font-bold text-slate-700">નોંધણી ક્રમાંક: {trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'}</p>
                </div>
                <div className="w-16 h-16 flex-shrink-0 opacity-0"></div>
              </div>

              {/* Certificate Metadata Bar */}
              <div className="p-3 bg-amber-100/60 border border-amber-300 rounded-xl flex justify-between items-center text-xs font-mono font-bold">
                <div>સર્ટિફિકેટ નં.: <span className="text-amber-900">{selectedShareCertData.purchase?.certificateNo || selectedShareCertData.member.shareCertificateNo || 'CERT-001'}</span></div>
                <div>ફોલિયો નં.: <span className="text-indigo-900">{selectedShareCertData.purchase?.folioNumber || selectedShareCertData.member.folioNumber || 'FOLIO-001'}</span></div>
                <div>તારીખ: <span className="text-slate-800">{selectedShareCertData.purchase?.date || selectedShareCertData.member.joiningDate}</span></div>
              </div>

              {/* Certificate Declaration Text */}
              <div className="space-y-4 text-center py-2">
                <p className="text-xs text-slate-700 leading-relaxed">
                  આથી પ્રમાણિત કરવામાં આવે છે કે શ્રી / શ્રીમતી / મેસર્સ
                </p>
                <h2 className="text-xl font-black text-indigo-900 underline decoration-amber-500 decoration-2 underline-offset-4">
                  {selectedShareCertData.member.nameGuj}
                </h2>
                <p className="text-xs font-mono font-bold text-slate-600">
                  (સભાસદ ક્રમાંક: {selectedShareCertData.member.memberNo || `M-${selectedShareCertData.member.id}`})
                </p>
                <p className="text-xs text-slate-800 leading-relaxed max-w-lg mx-auto">
                  આ સંસ્થાના દર્શનીય કિંમત <span className="font-bold text-slate-900">રૂ. ૧૦૦/- (રૂપિયા સો પુરા)</span> વાળા કુલ{' '}
                  <span className="font-black text-amber-900 text-sm font-mono px-2 py-0.5 bg-amber-200 rounded">
                    {selectedShareCertData.purchase?.shareCount || selectedShareCertData.member.shareCount || 10} શેર
                  </span>{' '}
                  ધારણ કરે છે, જેની કુલ ભરપાઈ શેર મૂડી રકમ{' '}
                  <span className="font-bold text-emerald-700 font-mono">
                    ₹ {(selectedShareCertData.purchase?.totalAmount || selectedShareCertData.member.totalShareAmount || 1000).toLocaleString('en-IN')}/-
                  </span>{' '}
                  સંસ્થાને પ્રાપ્ત થયેલ છે.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-12 flex justify-between items-end text-xs font-bold text-slate-800">
                <div className="text-center">
                  <div className="w-28 border-b-2 border-slate-800 mb-1"></div>
                  <span>ખજાનચી / એકાઉન્ટન્ટ</span>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full border-2 border-amber-600 flex items-center justify-center text-[10px] text-amber-800 font-bold opacity-80 rotate-12">
                    સંસ્થાનો સિકો / સિક્કો
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-28 border-b-2 border-slate-800 mb-1"></div>
                  <span>પ્રમુખ / મંત્રી</span>
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleDownloadPDF('printable-share-certificate', `Share_Certificate_${selectedShareCertData.member.memberNo || selectedShareCertData.member.id}`)}
                disabled={isGeneratingPDF}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF ડાઉનલોડ
              </button>
              <button
                onClick={() => printContainer('printable-share-certificate')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ સર્ટિફિકેટ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINTABLE MODAL 3: BANK LOAN RECOMMENDATION NOC LETTER --- */}
      {selectedLoanCertData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-amber-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> બેંક ધિરાણ ભલામણ પત્રક અને ના-વાંધા પ્રમાણપત્ર (Bank Loan NOC)
              </h3>
              <button onClick={() => setSelectedLoanCertData(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Formal Trust Letterhead Frame */}
            <div id="printable-loan-noc-letter" className="p-8 border-2 border-slate-800 rounded-xl space-y-6 bg-white text-slate-900">
              {/* Trust Letterhead Header with Logo */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 gap-4">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                </div>
                <div className="flex-1 text-center">
                  <h1 className="text-2xl font-black text-indigo-950">{trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}</h1>
                  <p className="text-xs font-medium text-slate-700">{trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'}</p>
                  <p className="text-xs font-mono text-slate-600">
                    નોંધણી ક્રમાંક: {trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'} | ફોન: {trustSettings?.phone || '9825012345'}
                  </p>
                </div>
                <div className="w-16 h-16 flex-shrink-0 opacity-0"></div>
              </div>

              {/* Reference & Date */}
              <div className="flex justify-between text-xs font-mono border-b border-slate-200 pb-2">
                <div>જાવક ક્રમાંક: <span className="font-bold text-indigo-900">{selectedLoanCertData.recommendationLetterNo || 'NOC-2026-001'}</span></div>
                <div>તારીખ: <span className="font-bold">{selectedLoanCertData.approvalDate || selectedLoanCertData.date}</span></div>
              </div>

              {/* Addressed To */}
              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-800">પ્રતિ શ્રી,</p>
                <p className="font-black text-indigo-950 text-sm">{selectedLoanCertData.bankNameGuj}</p>
                <p className="text-slate-700">{selectedLoanCertData.branchGuj || 'શાખા'}</p>
              </div>

              {/* Subject */}
              <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-900 border border-slate-300">
                વિષય: સભાસદ શ્રી <span className="text-indigo-900 underline">{selectedLoanCertData.memberNameGuj}</span> ની બેંક લોન અરજી સંદર્ભે ના-વાંધા પ્રમાણપત્ર (NOC) તથા ભલામણ પત્રક આપવા બાબત.
              </div>

              {/* Certified Letter Content */}
              <div className="text-xs text-slate-800 space-y-3 leading-relaxed">
                <p>મહાનુભાવ,</p>
                <p>
                  સવિનય જણાવવાનું કે અમારા મંડળી/ટ્રસ્ટના નોંધાયેલ સભાસદ શ્રી <span className="font-bold text-slate-950">{selectedLoanCertData.memberNameGuj}</span> (સભાસદ ક્રમાંક: <span className="font-mono font-bold">{selectedLoanCertData.memberNo || 'M-001'}</span>, ફોલિયો ક્રમાંક: <span className="font-mono font-bold">{selectedLoanCertData.folioNumber || 'FOLIO-001'}</span>) એ આપની બેંકમાંથી{' '}
                  <span className="font-bold text-indigo-900">{selectedLoanCertData.loanTypeGuj}</span> હેતુ માટે{' '}
                  <span className="font-bold font-mono text-emerald-700">₹ {selectedLoanCertData.requestedAmount.toLocaleString('en-IN')}/-</span> ની લોન મેળવવા માટે અરજી કરેલ છે.
                </p>
                <p>આથી આ મંડળી/ટ્રસ્ટ દ્વારા પ્રમાણિત કરવામાં આવે છે કે:</p>
                <ul className="list-disc pl-5 space-y-1 font-medium">
                  <li>સભાસદ શ્રી ની સંસ્થા પ્રત્યેની નીતિ-રીતિ ઉત્તમ અને વફાદાર છે.</li>
                  <li>સભાસદ સંસ્થા પાસે જરૂરી શેર મૂડી ધારણ કરે છે અને સંસ્થાનું કોઈ બાકી લેણું ચડત નથી.</li>
                  {selectedLoanCertData.guarantor1NameGuj && (
                    <li>સભાસદના જામીનદાર તરીકે શ્રી {selectedLoanCertData.guarantor1NameGuj} {selectedLoanCertData.guarantor2NameGuj ? `તથા શ્રી ${selectedLoanCertData.guarantor2NameGuj}` : ''} એ સંમતિ આપેલ છે.</li>
                  )}
                  <li>કારોબારી સમિતિ બેઠકના નિર્ણય મુજબ સભાસદને <span className="font-bold font-mono text-emerald-700">₹ {selectedLoanCertData.recommendedAmount.toLocaleString('en-IN')}/-</span> ની લોન ધિરાણ આપવા માટે આ સંસ્થાનો કોઈપણ પ્રકારનો વાંધો નથી.</li>
                </ul>
                <p className="pt-2">
                  આથી આપની બેંકને સભાસદ શ્રી ના નિયમાનુસાર લોન અરજી ધ્યાને લઈ ધિરાણ મંજૂર કરવા આથી ભલામણ કરવામાં આવે છે.
                </p>
              </div>

              {/* Resolution Note if available */}
              {selectedLoanCertData.remarksGuj && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 font-medium">
                  નોંધ: {selectedLoanCertData.remarksGuj}
                </div>
              )}

              {/* Signatures */}
              <div className="pt-10 flex justify-between items-end text-xs font-bold text-slate-800">
                <div className="text-center">
                  <div className="w-28 border-b border-slate-400 mb-1"></div>
                  <span>મંત્રી / સેક્રેટરી</span>
                </div>
                <div className="text-center">
                  <div className="w-28 border-b border-slate-400 mb-1"></div>
                  <span>પ્રમુખ / ટ્રસ્ટી સહી</span>
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleDownloadPDF('printable-loan-noc-letter', `Bank_Loan_NOC_${selectedLoanCertData.applicationNo}`)}
                disabled={isGeneratingPDF}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF ડાઉનલોડ
              </button>
              <button
                onClick={() => printContainer('printable-loan-noc-letter')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ NOC ભલામણ પત્રક
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINTABLE MODAL 4: CONSOLIDATED BANK LOAN RECOMMENDATION SCHEDULE PATRAK --- */}
      {showConsolidatedPatrakModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-5 space-y-4 shadow-2xl max-h-[96vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" /> સંયુક્ત બેંક લોન માગણી અને ભલામણ પત્રક (Consolidated Bank Loan Schedule)
                </h3>
                <p className="text-xs text-slate-500">બેંકને સભાસદોની લોન મંજૂરી માટે રજૂ કરવાનું સત્તાવાર સંયુક્ત પત્રક (Generate, Print & PDF Download)</p>
              </div>
              <button
                onClick={() => setShowConsolidatedPatrakModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Patrak Controls Toolbar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">બેંક પસંદ કરો:</label>
                  <select
                    value={patrakBankFilter}
                    onChange={e => setPatrakBankFilter(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  >
                    <option value="all">તમામ બેંકો (All Banks)</option>
                    {uniqueBankNames.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">જાવક નંબર (Outward No):</label>
                  <input
                    type="text"
                    value={patrakOutwardNo}
                    onChange={e => setPatrakOutwardNo(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">પત્રક તારીખ (Date):</label>
                  <input
                    type="date"
                    value={patrakDate}
                    onChange={e => setPatrakDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">કારોબારી ઠરાવ નં. અને તારીખ:</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={patrakResolutionNo}
                      onChange={e => setPatrakResolutionNo(e.target.value)}
                      placeholder="ઠરાવ નં."
                      className="w-1/2 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    />
                    <input
                      type="date"
                      value={patrakResolutionDate}
                      onChange={e => setPatrakResolutionDate(e.target.value)}
                      className="w-1/2 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Applicant Checkbox Selector */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">પત્રકમાં સમાવિષ્ટ અરજદારો ({patrakSelectedLoans.length} / {patrakFilteredLoans.length}):</span>
                  <button
                    onClick={() => setSelectedLoanIdsForPatrak(patrakFilteredLoans.map(l => l.id))}
                    className="px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold rounded-md hover:bg-indigo-200"
                  >
                    તમામ પસંદ કરો
                  </button>
                  <button
                    onClick={() => setSelectedLoanIdsForPatrak([])}
                    className="px-2 py-1 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-bold rounded-md hover:bg-slate-300"
                  >
                    તમામ રદ કરો
                  </button>
                </div>
              </div>
            </div>

            {/* Printable Formal Document Area */}
            <div id="printable-consolidated-loan-patrak" className="p-6 sm:p-8 border-2 border-slate-800 rounded-xl space-y-6 bg-white text-slate-900">
              {/* Header Letterhead with Logo */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 gap-4">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                </div>
                <div className="flex-1 text-center">
                  <h1 className="text-2xl font-black text-indigo-950">{trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}</h1>
                  <p className="text-xs font-medium text-slate-700">{trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'}</p>
                  <p className="text-xs font-mono text-slate-600">
                    નોંધણી ક્રમાંક: {trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'} | ફોન: {trustSettings?.phone || '9825012345'}
                  </p>
                </div>
                <div className="w-16 h-16 flex-shrink-0 opacity-0"></div>
              </div>

              {/* Document Title Banner */}
              <div className="text-center bg-indigo-50 border border-indigo-200 rounded-lg p-2.5">
                <h2 className="text-base font-black text-indigo-950 uppercase tracking-wide">
                  સભાસદ બેંક ધિરાણ માગણી અને ભલામણ પત્રક (BANK LOAN RECOMMENDATION SCHEDULE)
                </h2>
              </div>

              {/* Meta Details Row */}
              <div className="grid grid-cols-2 gap-4 text-xs font-medium border-b border-slate-300 pb-3">
                <div className="space-y-1">
                  <p><span className="font-bold text-slate-700">જાવક ક્રમાંક:</span> <span className="font-mono font-bold text-indigo-900">{patrakOutwardNo}</span></p>
                  <p><span className="font-bold text-slate-700">સંબંધિત બેંક:</span> <span className="font-bold text-slate-900">{patrakBankFilter === 'all' ? 'સહકારી / રાષ્ટ્રીયકૃત બેંક મુખ્ય શાખા' : patrakBankFilter}</span></p>
                </div>
                <div className="space-y-1 text-right">
                  <p><span className="font-bold text-slate-700">પત્રક તારીખ:</span> <span className="font-mono font-bold">{patrakDate}</span></p>
                  <p><span className="font-bold text-slate-700">કારોબારી ઠરાવ વિગત:</span> <span className="font-bold">{patrakResolutionNo} (તારીખ: {patrakResolutionDate})</span></p>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 text-slate-900">
                      <th className="p-2 border border-slate-400 text-center font-bold">અ.નં.</th>
                      <th className="p-2 border border-slate-400 font-bold">સભાસદ નં. / ફોલિયો</th>
                      <th className="p-2 border border-slate-400 font-bold">સભાસદનું પૂરૂં નામ</th>
                      <th className="p-2 border border-slate-400 text-center font-bold">શેર (સંખ્યા / રકમ)</th>
                      <th className="p-2 border border-slate-400 font-bold">લોનનો પ્રકાર અને હેતુ</th>
                      <th className="p-2 border border-slate-400 text-right font-bold">માગેલી રકમ (₹)</th>
                      <th className="p-2 border border-slate-400 text-right font-bold">ભલામણ રકમ (₹)</th>
                      <th className="p-2 border border-slate-400 font-bold">જામીનદારોના નામો</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {patrakSelectedLoans.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                          પત્રકમાં સમાવિષ્ટ કરવા માટે કોઈ લોન અરજી પસંદ કરેલ નથી.
                        </td>
                      </tr>
                    ) : (
                      patrakSelectedLoans.map((l, idx) => {
                        const m = members.find(mbr => mbr.id === l.memberId);
                        return (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-2 border border-slate-300 text-center font-mono font-bold">{idx + 1}</td>
                            <td className="p-2 border border-slate-300 font-mono">
                              <span className="font-bold text-slate-900 block">{l.memberNo || m?.memberNo || 'M-001'}</span>
                              <span className="text-[10px] text-slate-500 block">ફોલિયો: {l.folioNumber || m?.folioNumber || 'N/A'}</span>
                            </td>
                            <td className="p-2 border border-slate-300 font-bold text-slate-900">
                              {l.memberNameGuj}
                            </td>
                            <td className="p-2 border border-slate-300 text-center font-mono text-[11px]">
                              <span className="font-bold block">{m?.shareCount || 10} શેર</span>
                              <span className="text-slate-500 text-[10px]">₹ {((m?.shareCount || 10) * (m?.sharePrice || 100)).toLocaleString('en-IN')}</span>
                            </td>
                            <td className="p-2 border border-slate-300">
                              <span className="font-bold text-indigo-900 block">{l.loanTypeGuj}</span>
                              <span className="text-[10px] text-slate-600 block">{l.purposeGuj}</span>
                            </td>
                            <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-800">
                              ₹ {l.requestedAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2 border border-slate-300 text-right font-mono font-black text-emerald-800">
                              ₹ {l.recommendedAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2 border border-slate-300 text-[11px]">
                              {l.guarantor1NameGuj && <div className="font-medium text-slate-800">૧. {l.guarantor1NameGuj}</div>}
                              {l.guarantor2NameGuj && <div className="font-medium text-slate-800">૨. {l.guarantor2NameGuj}</div>}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Totals Row */}
                  <tfoot>
                    <tr className="bg-slate-200 font-black text-slate-950 border-t-2 border-slate-800">
                      <td colSpan={5} className="p-2.5 border border-slate-400 text-right uppercase">
                        કુલ અરજદારો: {patrakSelectedLoans.length} સભાસદ | કાયદેસર કુલ રકમ:
                      </td>
                      <td className="p-2.5 border border-slate-400 text-right font-mono text-sm text-slate-900">
                        ₹ {totalPatrakRequested.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border border-slate-400 text-right font-mono text-sm text-emerald-900">
                        ₹ {totalPatrakRecommended.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border border-slate-400"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Official Declaration */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-800 space-y-1.5">
                <p className="font-bold text-slate-900">સહિયારી ખાતરી પત્રક અને સત્તાવાર સંમતિ:</p>
                <p>
                  આથી બેંક શાખા મેનેજરશ્રીને સાદર સવિનય ભલામણ સાથે જણાવવાનું કે, ઉપર કોષ્ટકમાં દર્શાવેલ ક્રમ ૧ થી {patrakSelectedLoans.length} સુધીના તમામ અરજદારો આ સંસ્થાના કાયદેસરના નોંધાયેલા શેરધારક સભાસદો છે. કારોબારી સમિતિના ઠરાવ મુજબ તમામ અરજદારોની પરામર્શ કરી બેંકમાંથી ધિરાણ મંજૂર કરવા અર્થે આ સંયુક્ત ભલામણ પત્રક અને ના-વાંધા પ્રમાણપત્ર (NOC) મંજૂર કરી રજૂ કરવામાં આવે છે.
                </p>
              </div>

              {/* Signatures Row */}
              <div className="pt-10 grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-800">
                <div>
                  <div className="w-24 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>ખજાનચીશ્રી</span>
                </div>
                <div>
                  <div className="w-24 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>મંત્રી / સેક્રેટરી</span>
                </div>
                <div>
                  <div className="w-24 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>પ્રમુખ / ટ્રસ્ટી</span>
                </div>
                <div>
                  <div className="w-24 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>બેંક મેનેજરશ્રી પહોંચ સિક્કો</span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-bold text-slate-500">કુલ {patrakSelectedLoans.length} અરજદારો પત્રકમાં રજૂ થયેલ છે.</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadPDF('printable-consolidated-loan-patrak', `Bank_Loan_Schedule_Patrak_${patrakDate}`)}
                  disabled={isGeneratingPDF}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF ડાઉનલોડ
                </button>
                <button
                  onClick={() => printContainer('printable-consolidated-loan-patrak')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ સંયુક્ત પત્રક
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: RECORD BANK LOAN SANCTION & DISBURSEMENT --- */}
      {disbursementLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" /> બેંક ધિરાણ મંજૂરી અને ચુકવણી નોંધ (Loan Sanction & Disbursement)
                </h3>
                <p className="text-xs text-slate-500">બેંક દ્વારા મંજૂર થયેલ લોન રકમ, મંજૂરી પત્ર નં., વ્યાજ દર અને ચુકવણીની સત્તાવાર નોંધ કરો</p>
              </div>
              <button
                onClick={() => setDisbursementLoan(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDisbursement} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <p><span className="font-bold text-slate-600 dark:text-slate-400">સભાસદ:</span> <span className="font-bold text-slate-900 dark:text-slate-100">{disbursementLoan.memberNameGuj} ({disbursementLoan.memberNo || 'M-001'})</span></p>
                <p><span className="font-bold text-slate-600 dark:text-slate-400">બેંક શાખા:</span> <span className="font-bold text-slate-900 dark:text-slate-100">{disbursementLoan.bankNameGuj} - {disbursementLoan.branchGuj}</span></p>
                <p><span className="font-bold text-slate-600 dark:text-slate-400">અરજી નં:</span> <span className="font-mono font-bold text-amber-600">{disbursementLoan.applicationNo}</span> | <span className="font-bold text-slate-600 dark:text-slate-400">માગેલી રકમ:</span> <span className="font-mono font-bold text-indigo-600">₹ {disbursementLoan.requestedAmount.toLocaleString('en-IN')}</span></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">બેંક મંજૂર થયેલ રકમ (₹) *:</label>
                  <input
                    type="number"
                    required
                    value={sanctionedAmount}
                    onChange={e => setSanctionedAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-sm text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">બેંક મંજૂરી પત્ર ક્રમાંક (Letter No) *:</label>
                  <input
                    type="text"
                    required
                    value={sanctionLetterNo}
                    onChange={e => setSanctionLetterNo(e.target.value)}
                    placeholder="દા.ત. SNC/BANK/2026/102"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ચુકવણી તારીખ (Disbursement Date) *:</label>
                  <input
                    type="date"
                    required
                    value={disbursementDate}
                    onChange={e => setDisbursementDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ચુકવણી પદ્ધતિ (Disbursement Mode):</label>
                  <select
                    value={disbursementMode}
                    onChange={e => setDisbursementMode(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="બેંક ખાતામાં જમા (Bank Transfer)">બેંક ખાતામાં જમા (Bank Transfer)</option>
                    <option value="ચેક (Cheque)">ચેક (Cheque)</option>
                    <option value="રોકડ / ડીડી (Cash/DD)">રોકડ / ડીડી (Cash/DD)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ચેક / UTR / રેફરન્સ નંબર:</label>
                  <input
                    type="text"
                    value={chequeOrRefNo}
                    onChange={e => setChequeOrRefNo(e.target.value)}
                    placeholder="દા.ત. UTR-98215421"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">વાર્ષિક વ્યાજ દર (% p.a.):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={e => setInterestRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">પરત ચૂકવણી મુદ્દત (મહિના):</label>
                  <input
                    type="number"
                    value={tenureMonths}
                    onChange={e => setTenureMonths(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">અંદાજિત માસિક હપ્તો (₹ EMI):</label>
                  <input
                    type="number"
                    value={monthlyInstallmentAmount}
                    onChange={e => setMonthlyInstallmentAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDisbursementLoan(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> બેંક મંજૂરી અને ચુકવણી સાચવો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 6: COLLECT LOAN INSTALLMENT / REPAYMENT --- */}
      {repaymentLoan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> સભાસદ લોન હપ્તા વસૂલાત અને રસીદ નોંધ (Loan Repayment)
                </h3>
                <p className="text-xs text-slate-500">સભાસદ પાસેથી મુદ્દલ અને વ્યાજના હપ્તાની વસૂલાત નોંધો અને પાવતી ઇશ્યુ કરો</p>
              </div>
              <button
                onClick={() => setRepaymentLoan(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRepayment} className="space-y-4 text-xs">
              {/* Summary Header */}
              {(() => {
                const totalSanc = repaymentLoan.sanctionedAmount || repaymentLoan.recommendedAmount || 100000;
                const totalPaidSoFar = (repaymentLoan.repayments || []).reduce((sum, r) => sum + r.principalPaid, 0);
                const remBal = Math.max(0, totalSanc - totalPaidSoFar);
                return (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
                    <p><span className="font-bold text-slate-700 dark:text-slate-300">સભાસદ:</span> <span className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">{repaymentLoan.memberNameGuj} ({repaymentLoan.memberNo || 'M-001'})</span></p>
                    <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500 block">કુલ મંજૂર:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">₹ {totalSanc.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">વસૂલ થયેલ:</span>
                        <span className="font-bold text-emerald-600">₹ {totalPaidSoFar.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">બાકી મુદ્દલ:</span>
                        <span className="font-bold text-rose-600">₹ {remBal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">હપ્તા તારીખ (Date) *:</label>
                  <input
                    type="date"
                    required
                    value={repaymentDate}
                    onChange={e => setRepaymentDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">રસીદ નંબર (Receipt No) *:</label>
                  <input
                    type="text"
                    required
                    value={repaymentReceiptNo}
                    onChange={e => setRepaymentReceiptNo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">જમા મુદ્દલ રકમ (Principal ₹) *:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={repaymentPrincipal}
                    onChange={e => setRepaymentPrincipal(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">જમા વ્યાજ રકમ (Interest ₹):</label>
                  <input
                    type="number"
                    value={repaymentInterest}
                    onChange={e => setRepaymentInterest(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">કુલ ભરેલી રકમ (Total ₹):</label>
                  <div className="w-full p-2.5 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl font-mono font-black text-sm text-emerald-900 dark:text-emerald-200">
                    ₹ {(Number(repaymentPrincipal) + Number(repaymentInterest)).toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">નાણાં સ્વીકાર પદ્ધતિ:</label>
                  <select
                    value={repaymentMode}
                    onChange={e => setRepaymentMode(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="રોકડ (Cash)">રોકડ (Cash)</option>
                    <option value="બેંક ટ્રાન્સફર (Bank)">બેંક ટ્રાન્સફર (Bank Transfer)</option>
                    <option value="ચેક (Cheque)">ચેક (Cheque)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">નોંધ / રિમાર્કસ:</label>
                <input
                  type="text"
                  value={repaymentRemarks}
                  onChange={e => setRepaymentRemarks(e.target.value)}
                  placeholder="દા.ત. ફેબ્રુઆરી માસનો પ્રથમ હપ્તો જમા"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRepaymentLoan(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> લોન હપ્તો જમા કરો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PRINTABLE MODAL 7: MEMBER LOAN ACCOUNT LEDGER STATEMENT --- */}
      {selectedLoanLedgerData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-5 space-y-4 shadow-2xl max-h-[96vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-purple-700 dark:text-purple-400 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" /> સભાસદ બેંક ધિરાણ ખાતાવહી અને હપ્તા સ્ટેટમેન્ટ (Loan Account Ledger)
                </h3>
                <p className="text-xs text-slate-500">લોન મંજૂરી, બેંક ચુકવણી અને અત્યાર સુધીના તમામ હપ્તા ભરપાઈનું સત્તાવાર સ્ટેટમેન્ટ (Print & Download PDF)</p>
              </div>
              <button
                onClick={() => setSelectedLoanLedgerData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Formal Statement */}
            <div id="printable-member-loan-ledger" className="p-6 sm:p-8 border-2 border-slate-800 rounded-xl space-y-6 bg-white text-slate-900">
              {/* Trust Letterhead with Logo */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 gap-4">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                </div>
                <div className="flex-1 text-center">
                  <h1 className="text-2xl font-black text-indigo-950">{trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}</h1>
                  <p className="text-xs font-medium text-slate-700">{trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'}</p>
                  <p className="text-xs font-mono text-slate-600">
                    નોંધણી ક્રમાંક: {trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'} | ફોન: {trustSettings?.phone || '9825012345'}
                  </p>
                </div>
                <div className="w-16 h-16 flex-shrink-0 opacity-0"></div>
              </div>

              {/* Document Title */}
              <div className="text-center bg-purple-50 border border-purple-200 rounded-lg p-2.5">
                <h2 className="text-base font-black text-purple-950 uppercase tracking-wide">
                  સભાસદ લોન ખાતાવહી અને હપ્તા સ્ટેટમેન્ટ (MEMBER LOAN LEDGER STATEMENT)
                </h2>
              </div>

              {/* Loan Meta Details */}
              {(() => {
                const totalSanc = selectedLoanLedgerData.sanctionedAmount || selectedLoanLedgerData.recommendedAmount || 0;
                const reps = selectedLoanLedgerData.repayments || [];
                const totalPaidP = reps.reduce((sum, r) => sum + r.principalPaid, 0);
                const totalPaidI = reps.reduce((sum, r) => sum + r.interestPaid, 0);
                const remBalP = Math.max(0, totalSanc - totalPaidP);

                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium bg-slate-50 p-4 border border-slate-300 rounded-xl">
                      <div className="space-y-1.5">
                        <p><span className="font-bold text-slate-600">સભાસદનું નામ:</span> <span className="font-black text-slate-950 text-sm">{selectedLoanLedgerData.memberNameGuj}</span></p>
                        <p><span className="font-bold text-slate-600">સભાસદ ક્રમાંક / ફોલિયો:</span> <span className="font-mono font-bold text-indigo-900">{selectedLoanLedgerData.memberNo || 'M-001'} (ફોલિયો: {selectedLoanLedgerData.folioNumber || 'N/A'})</span></p>
                        <p><span className="font-bold text-slate-600">સંબંધિત બેંક અને શાખા:</span> <span className="font-bold text-slate-900">{selectedLoanLedgerData.bankNameGuj} - {selectedLoanLedgerData.branchGuj}</span></p>
                        <p><span className="font-bold text-slate-600">લોન હેતુ & પ્રકાર:</span> <span className="font-bold text-slate-800">{selectedLoanLedgerData.loanTypeGuj}</span></p>
                      </div>

                      <div className="space-y-1.5 text-right font-mono">
                        <p><span className="font-bold text-slate-600 font-sans">લોન અરજી નં:</span> <span className="font-bold text-amber-900">{selectedLoanLedgerData.applicationNo}</span></p>
                        <p><span className="font-bold text-slate-600 font-sans">બેંક મંજૂરી પત્ર નં:</span> <span className="font-bold text-emerald-900">{selectedLoanLedgerData.sanctionLetterNo || 'SNC-884/2026'}</span></p>
                        <p><span className="font-bold text-slate-600 font-sans">ચુકવણી તારીખ & રકમ:</span> <span className="font-black text-emerald-800 text-sm">{selectedLoanLedgerData.disbursementDate || selectedLoanLedgerData.date} (₹ {totalSanc.toLocaleString('en-IN')})</span></p>
                        <p><span className="font-bold text-slate-600 font-sans">વ્યાજ દર & મુદ્દત:</span> <span className="font-bold text-slate-800">{selectedLoanLedgerData.interestRate || 8.5}% p.a. ({selectedLoanLedgerData.tenureMonths || 12} મહિના)</span></p>
                      </div>
                    </div>

                    {/* Financial Summary Strip */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                      <div>
                        <span className="text-slate-500 font-sans text-[10px] block">કુલ મંજૂર રકમ</span>
                        <span className="font-black text-slate-900 text-sm">₹ {totalSanc.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans text-[10px] block">કુલ વસૂલ મુદ્દલ</span>
                        <span className="font-black text-emerald-700 text-sm">₹ {totalPaidP.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans text-[10px] block">કુલ વ્યાજ આવક</span>
                        <span className="font-black text-indigo-700 text-sm">₹ {totalPaidI.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans text-[10px] block">વર્તમાન બાકી મુદ્દલ</span>
                        <span className={`font-black text-sm ${remBalP > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>₹ {remBalP.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Repayments History Ledger Table */}
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 mb-2 uppercase tracking-wide">લોન હપ્તા ભરપાઈ ખાતાવહી (Repayment History Register)</h4>
                      <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-400 text-slate-900">
                            <th className="p-2 border border-slate-400 text-center font-bold">હપ્તો નં.</th>
                            <th className="p-2 border border-slate-400 font-bold">ભરપાઈ તારીખ</th>
                            <th className="p-2 border border-slate-400 font-bold">રસીદ ક્રમાંક</th>
                            <th className="p-2 border border-slate-400 text-right font-bold">જમા મુદ્દલ (₹)</th>
                            <th className="p-2 border border-slate-400 text-right font-bold">જમા વ્યાજ (₹)</th>
                            <th className="p-2 border border-slate-400 text-right font-bold">કુલ ભરપાઈ (₹)</th>
                            <th className="p-2 border border-slate-400 text-right font-bold">બાકી મુદ્દલ (₹)</th>
                            <th className="p-2 border border-slate-400 font-bold">પદ્ધતિ / વિગત</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {reps.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                                હજુ સુધી કોઈ લોન હપ્તો ભરપાઈ થયેલ નથી.
                              </td>
                            </tr>
                          ) : (
                            (() => {
                              let runningBal = totalSanc;
                              return reps.map(r => {
                                runningBal -= r.principalPaid;
                                return (
                                  <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="p-2 border border-slate-300 text-center font-mono font-bold">{r.installmentNo}</td>
                                    <td className="p-2 border border-slate-300 font-mono">{r.date}</td>
                                    <td className="p-2 border border-slate-300 font-mono font-bold text-indigo-900">{r.receiptNumber}</td>
                                    <td className="p-2 border border-slate-300 text-right font-mono font-bold text-emerald-800">
                                      ₹ {r.principalPaid.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-right font-mono font-bold text-indigo-800">
                                      ₹ {r.interestPaid.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-right font-mono font-black text-slate-900">
                                      ₹ {r.totalPaid.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-right font-mono font-bold text-rose-800">
                                      ₹ {Math.max(0, runningBal).toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-[11px]">
                                      <span className="font-bold block">{r.paymentMode}</span>
                                      <span className="text-[10px] text-slate-500 block">{r.remarksGuj}</span>
                                    </td>
                                  </tr>
                                );
                              });
                            })()
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-200 font-black text-slate-950 border-t-2 border-slate-800">
                            <td colSpan={3} className="p-2.5 border border-slate-400 text-right uppercase">
                              કુલ વસૂલાત યોગ:
                            </td>
                            <td className="p-2.5 border border-slate-400 text-right font-mono text-emerald-900">
                              ₹ {totalPaidP.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 border border-slate-400 text-right font-mono text-indigo-900">
                              ₹ {totalPaidI.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 border border-slate-400 text-right font-mono text-sm text-slate-950">
                              ₹ {(totalPaidP + totalPaidI).toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 border border-slate-400 text-right font-mono text-rose-900">
                              ₹ {remBalP.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2.5 border border-slate-400"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Official Declaration */}
                    <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-800">
                      <p className="font-bold text-slate-900">ખાતરી પ્રમાણપત્ર:</p>
                      <p>
                        આથી સત્તાવાર રીતે પ્રમાણિત કરવામાં આવે છે કે ઉપર દર્શાવેલ લોન ખાતાવહી અને હપ્તા ભરપાઈની તમામ વિગતો સંસ્થાના સત્તાવાર ચોપડે દર્શાવેલ હિસાબ મુજબ સાચી અને પ્રમાણિત છે.
                      </p>
                    </div>

                    {/* Signatures */}
                    <div className="pt-10 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-800">
                      <div>
                        <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                        <span>સભાસદની સહી</span>
                      </div>
                      <div>
                        <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                        <span>એકાઉન્ટન્ટ / ખજાનચી</span>
                      </div>
                      <div>
                        <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                        <span>પ્રમુખ / સેક્રેટરી / ટ્રસ્ટી સહી</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Bottom Controls */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleDownloadPDF('printable-member-loan-ledger', `Loan_Ledger_${selectedLoanLedgerData.memberNo || selectedLoanLedgerData.id}`)}
                disabled={isGeneratingPDF}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF ડાઉનલોડ
              </button>
              <button
                onClick={() => printContainer('printable-member-loan-ledger')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ ખાતાવહી સ્ટેટમેન્ટ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINTABLE MODAL 8: BANK LOAN DISBURSEMENT ADVICE VOUCHER --- */}
      {selectedDisbursementAdviceData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-5 space-y-4 shadow-2xl max-h-[96vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-teal-700 dark:text-teal-400 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" /> બેંક ધિરાણ ચુકવણી સલાહ પત્રક / વાઉચર (Disbursement Advice Voucher)
                </h3>
                <p className="text-xs text-slate-500">બેંકમાંથી સભાસદને ધિરાણ મંજૂર થઈ ચુકવણી થયાનું સત્તાવાર પ્રમાણપત્ર અને સ્વીકૃતિ પાકી રસીદ</p>
              </div>
              <button
                onClick={() => setSelectedDisbursementAdviceData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Formal Voucher */}
            <div id="printable-disbursement-voucher" className="p-6 sm:p-8 border-2 border-slate-800 rounded-xl space-y-6 bg-white text-slate-900">
              {/* Trust Letterhead with Logo */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 gap-4">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                </div>
                <div className="flex-1 text-center">
                  <h1 className="text-2xl font-black text-indigo-950">{trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}</h1>
                  <p className="text-xs font-medium text-slate-700">{trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'}</p>
                  <p className="text-xs font-mono text-slate-600">
                    નોંધણી ક્રમાંક: {trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'} | ફોન: {trustSettings?.phone || '9825012345'}
                  </p>
                </div>
                <div className="w-16 h-16 flex-shrink-0 opacity-0"></div>
              </div>

              {/* Title Banner */}
              <div className="text-center bg-teal-50 border border-teal-200 rounded-lg p-2.5">
                <h2 className="text-base font-black text-teal-950 uppercase tracking-wide">
                  બેંક ધિરાણ મંજૂરી અને ચુકવણી સ્વીકૃતિ વાઉચર (LOAN DISBURSEMENT VOUCHER)
                </h2>
              </div>

              {/* Details Box */}
              <div className="p-4 border border-slate-300 rounded-xl space-y-3 text-xs leading-relaxed">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-slate-600">બેંક મંજૂરી પત્ર નં:</span>
                    <span className="font-mono font-bold text-indigo-900 block text-sm">{selectedDisbursementAdviceData.sanctionLetterNo || 'SNC-884/2026'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-600">ચુકવણી તારીખ:</span>
                    <span className="font-mono font-bold text-slate-900 block text-sm">{selectedDisbursementAdviceData.disbursementDate || selectedDisbursementAdviceData.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-slate-600">સભાસદનું નામ:</span>
                    <span className="font-bold text-slate-950 block text-sm">{selectedDisbursementAdviceData.memberNameGuj}</span>
                    <span className="text-[11px] font-mono text-slate-500">સભાસદ નં.: {selectedDisbursementAdviceData.memberNo || 'M-001'} | ફોલિયો: {selectedDisbursementAdviceData.folioNumber || 'N/A'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-600">ધિરાણ આપનાર બેંક:</span>
                    <span className="font-bold text-slate-900 block">{selectedDisbursementAdviceData.bankNameGuj}</span>
                    <span className="text-[11px] text-slate-600 block">{selectedDisbursementAdviceData.branchGuj}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex justify-between items-center my-2">
                  <span className="font-bold text-emerald-950 text-xs">બેંક દ્વારા મંજૂર અને ચૂકવેલ કાયદેસર લોન રકમ:</span>
                  <span className="text-lg font-black font-mono text-emerald-800">
                    ₹ {(selectedDisbursementAdviceData.sanctionedAmount || selectedDisbursementAdviceData.recommendedAmount || 0).toLocaleString('en-IN')} /-
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">ચુકવણી પદ્ધતિ:</span>
                    <span className="font-bold text-slate-800">{selectedDisbursementAdviceData.disbursementMode || 'બેંક ટ્રાન્સફર'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">રેફરન્સ / UTR / Cheque:</span>
                    <span className="font-bold text-slate-800">{selectedDisbursementAdviceData.chequeOrRefNo || 'UTR-9821445'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">વ્યાજ દર & મુદ્દત:</span>
                    <span className="font-bold text-slate-800">{selectedDisbursementAdviceData.interestRate || 8.5}% p.a. ({selectedDisbursementAdviceData.tenureMonths || 12} માસ)</span>
                  </div>
                </div>
              </div>

              {/* Declaration */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 leading-relaxed">
                <p className="font-bold">સભાસદ કબૂલાત અને પોંચ:</p>
                <p>
                  આથી હું સભાસદ {selectedDisbursementAdviceData.memberNameGuj} સંતોષપૂર્વક કબૂલ કરું છું કે ઉપર દર્શાવેલ રકમ મને બેંક તરફથી કાયદેસર પ્રાપ્ત થયેલ છે. આ લોન રકમની પરત ચૂકવણી બેંક તથા સંસ્થાના નિયમોનુસાર સમયસર કરવા હું બંધાયેલો છું.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-800">
                <div>
                  <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>સભાસદની સહી (ગ્રાહક)</span>
                </div>
                <div>
                  <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>જામીનદાર સહી</span>
                </div>
                <div>
                  <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>બેંક અધિકારી / ટ્રસ્ટી સહી</span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleDownloadPDF('printable-disbursement-voucher', `Disbursement_Voucher_${selectedDisbursementAdviceData.applicationNo}`)}
                disabled={isGeneratingPDF}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF ડાઉનલોડ
              </button>
              <button
                onClick={() => printContainer('printable-disbursement-voucher')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ વાઉચર
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINTABLE MODAL 9: GENERAL SABHASAD LOAN STATEMENT --- */}
      {showGeneralLoanStatementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-5 space-y-4 shadow-2xl max-h-[96vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-purple-700 dark:text-purple-400 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" /> સભાસદ સામાન્ય લોન / ધિરાણ સ્ટેટમેન્ટ (General Loan Statement)
                </h3>
                <p className="text-xs text-slate-500">
                  તમામ સભાસદોએ લીધેલ બેંક લોન, મંજૂર રકમ, જમા થયેલ હપ્તા/મુદ્દલ, જમા વ્યાજ અને બાકી લોન રકમનું સત્તાવાર સ્ટેટમેન્ટ
                </p>
              </div>
              <button
                onClick={() => setShowGeneralLoanStatementModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls & Filters Bar */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={generalLoanBankFilter}
                  onChange={e => setGeneralLoanBankFilter(e.target.value)}
                  className="p-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <option value="all">બધી બેંકો ({loanApplications.length})</option>
                  {uniqueBankNames.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                <select
                  value={generalLoanStatusFilter}
                  onChange={e => setGeneralLoanStatusFilter(e.target.value)}
                  className="p-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <option value="all">તમામ લોન સ્થિતિ</option>
                  <option value="બેંક દ્વારા લોન મંજૂર અને ચુકવણી થયેલ (Sanctioned & Disbursed)">ચાલુ લોન (Disbursed)</option>
                  <option value="લોન પૂર્ણ / ભરપાઈ થયેલ (Closed / Fully Repaid)">ભરપાઈ થયેલ (Closed)</option>
                  <option value="ભલામણ મંજૂર / NOC ઇશ્યુ (Recommended & NOC Issued)">NOC ઇશ્યુ</option>
                </select>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="સભાસદનું નામ, લોન નંબર કે સભ્ય નંબર..."
                    value={generalLoanSearchQuery}
                    onChange={e => setGeneralLoanSearchQuery(e.target.value)}
                    className="bg-transparent outline-none w-48"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPDF('printable-general-loan-statement-modal', `Sabhasad_General_Loan_Statement_${new Date().toISOString().split('T')[0]}`)}
                  disabled={isGeneratingPDF}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF ડાઉનલોડ
                </button>
                <button
                  onClick={() => printContainer('printable-general-loan-statement-modal')}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> પ્રિન્ટ સ્ટેટમેન્ટ
                </button>
              </div>
            </div>

            {/* Printable Modal Container */}
            <div id="printable-general-loan-statement-modal" className="p-6 sm:p-8 border-2 border-slate-800 rounded-xl space-y-6 bg-white text-slate-900">
              {/* Trust Letterhead with Logo */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 gap-4">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <img src={trustSettings?.logoUrl || '/logo.png'} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" alt="Trust Logo" />
                </div>
                <div className="flex-1 text-center">
                  <h1 className="text-2xl font-black text-indigo-950">{trustSettings?.trustNameGuj || 'શ્રી સાર્વજનિક ચેરિટેબલ ટ્રસ્ટ'}</h1>
                  <p className="text-xs font-medium text-slate-700">{trustSettings?.addressGuj || 'મુ. પો. ગુજરાત'}</p>
                  <p className="text-xs font-mono text-slate-600">
                    નોંધણી ક્રમાંક: {trustSettings?.regNoGuj || trustSettings?.registrationNumber || 'F-12345/GUJ'} | ફોન: {trustSettings?.phone || '9825012345'}
                  </p>
                </div>
                <div className="w-16 h-16 flex-shrink-0 opacity-0"></div>
              </div>

              {/* Title */}
              <div className="text-center bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h2 className="text-base font-black text-purple-950 uppercase tracking-wide">
                  સભાસદ સામાન્ય લોન અને ધિરાણ સ્ટેટમેન્ટ (SABHASAD GENERAL LOAN STATEMENT)
                </h2>
                <p className="text-xs font-bold text-slate-700 mt-1">
                  તારીખ: {new Date().toLocaleDateString('en-IN')} | પત્રક ક્રમાંક: STMT/LOAN/{new Date().getFullYear()}
                </p>
              </div>

              {/* Financial KPI Summary Bar */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl">
                <div>
                  <span className="text-slate-500 font-sans text-[10px] block font-bold">કુલ લોનધારક સભાસદો</span>
                  <span className="font-black text-slate-900 text-sm">{generalFilteredLoans.length} સભાસદ</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans text-[10px] block font-bold">કુલ લીધેલી / મંજૂર લોન</span>
                  <span className="font-black text-indigo-900 text-sm">₹ {totalGenSanctionedAmt.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans text-[10px] block font-bold">કુલ જમા થયેલ હપ્તા (મુદ્દલ)</span>
                  <span className="font-black text-emerald-800 text-sm">₹ {totalGenPrincipalPaid.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] text-slate-500 block font-sans">(વ્યાજ જમા: ₹ {totalGenInterestPaid.toLocaleString('en-IN')})</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans text-[10px] block font-bold">કુલ બાકી લોન રકમ</span>
                  <span className={`font-black text-sm ${totalGenRemainingBal > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
                    ₹ {totalGenRemainingBal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 text-slate-900 font-bold">
                      <th className="p-2 border border-slate-400 text-center">ક્રમ</th>
                      <th className="p-2 border border-slate-400">સભાસદ નં. & નામ</th>
                      <th className="p-2 border border-slate-400">બેંક & લોન પ્રકાર</th>
                      <th className="p-2 border border-slate-400 text-right">મંજૂર/લીધેલી લોન (₹)</th>
                      <th className="p-2 border border-slate-400 text-right">જમા હપ્તા (મુદ્દલ) (₹)</th>
                      <th className="p-2 border border-slate-400 text-right">જમા વ્યાજ (₹)</th>
                      <th className="p-2 border border-slate-400 text-right">કુલ જમા (₹)</th>
                      <th className="p-2 border border-slate-400 text-right">બાકી લોન રકમ (₹)</th>
                      <th className="p-2 border border-slate-400 text-center">સ્થિતિ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-sans">
                    {generalFilteredLoans.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                          કોઈ સભાસદ લોન રેકોર્ડ મળેલ નથી.
                        </td>
                      </tr>
                    ) : (
                      generalFilteredLoans.map((l, index) => {
                        const sancAmt = l.sanctionedAmount || l.recommendedAmount || l.requestedAmount || 0;
                        const paidP = (l.repayments || []).reduce((sum, r) => sum + (r.principalPaid || 0), 0);
                        const paidI = (l.repayments || []).reduce((sum, r) => sum + (r.interestPaid || 0), 0);
                        const totalPaid = paidP + paidI;
                        const remBal = Math.max(0, sancAmt - paidP);

                        return (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-2 border border-slate-300 text-center font-mono font-bold">{index + 1}</td>
                            <td className="p-2 border border-slate-300">
                              <span className="font-bold text-slate-900 block">{l.memberNameGuj}</span>
                              <span className="text-[10px] text-slate-500 font-mono">સભાસદ નં.: {l.memberNo || 'N/A'}</span>
                            </td>
                            <td className="p-2 border border-slate-300">
                              <span className="font-bold text-indigo-900 block">{l.bankNameGuj}</span>
                              <span className="text-[10px] text-slate-600 block">{l.loanTypeGuj} ({l.applicationNo})</span>
                            </td>
                            <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                              ₹ {sancAmt.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2 border border-slate-300 text-right font-mono font-bold text-emerald-800">
                              ₹ {paidP.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2 border border-slate-300 text-right font-mono text-indigo-800">
                              ₹ {paidI.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                              ₹ {totalPaid.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2 border border-slate-300 text-right font-mono font-black text-rose-800">
                              ₹ {remBal.toLocaleString('en-IN')}
                            </td>
                            <td className="p-2 border border-slate-300 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                l.statusGuj.includes('પૂર્ણ') || l.statusGuj.includes('Closed')
                                  ? 'bg-blue-100 text-blue-900'
                                  : remBal === 0 && paidP > 0
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}>
                                {l.statusGuj.includes('પૂર્ણ') ? 'ભરપાઈ થયેલ' : remBal === 0 && paidP > 0 ? 'ચૂકવેલ' : 'ચાલુ લોન'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-black text-slate-950 border-t-2 border-slate-800">
                      <td colSpan={3} className="p-2.5 border border-slate-400 text-right uppercase">
                        કુલ સરવાળો (GRAND TOTAL):
                      </td>
                      <td className="p-2.5 border border-slate-400 text-right font-mono text-indigo-950">
                        ₹ {totalGenSanctionedAmt.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border border-slate-400 text-right font-mono text-emerald-900">
                        ₹ {totalGenPrincipalPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border border-slate-400 text-right font-mono text-indigo-900">
                        ₹ {totalGenInterestPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border border-slate-400 text-right font-mono text-slate-950">
                        ₹ {totalGenTotalPaid.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border border-slate-400 text-right font-mono text-rose-900 text-sm">
                        ₹ {totalGenRemainingBal.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 border border-slate-400"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Declaration */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-800">
                <p className="font-bold text-slate-900">સત્તાવાર ખાતરી:</p>
                <p>
                  આથી પ્રમાણિત કરવામાં આવે છે કે ઉપર મુજબ દર્શાવેલ તમામ સભાસદોની લોન રકમ, જમા થયેલ હપ્તા અને બાકી લેણી રકમ ચોપડે દર્શાવેલ હિસાબ મુજબ સાચી અને પ્રમાણિત છે.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-800">
                <div>
                  <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>તૈયાર કરનાર એકાઉન્ટન્ટ</span>
                </div>
                <div>
                  <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>ખજાનચી / મંત્રી સહી</span>
                </div>
                <div>
                  <div className="w-28 mx-auto border-b border-slate-400 mb-1"></div>
                  <span>પ્રમુખશ્રી / ટ્રસ્ટી સહી</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
