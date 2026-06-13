/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Coins,
  Scale,
  TrendingUp,
  DollarSign,
  Settings,
  FolderOpen,
  ArrowRightLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Database,
  RefreshCw,
  TrendingDown,
  Info,
  Layers,
  FileSpreadsheet,
  Globe,
  UserCheck,
  Plus,
  Minus,
  Wallet
} from "lucide-react";

import {
  Dealer,
  DealerStatementItem,
  PurchaseItem,
  SaleItem,
  PublicExpenseItem,
  PrivateWalletTransaction,
  AssayLogItem,
  DailyGoldPrices
} from "./types";

import {
  INITIAL_DEALERS,
  INITIAL_DEALER_STATEMENTS,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_PRIVATE_WALLET_TRANSACTIONS,
  INITIAL_ASSAY_LOGS,
  loadFromLocalStorage,
  saveToLocalStorage,
  formatCurrency,
  formatWeight
} from "./utils";

import DashboardOverview from "./components/DashboardOverview";
import PurchasesManager from "./components/PurchasesManager";
import SalesManager from "./components/SalesManager";
import ExpensesManager from "./components/ExpensesManager";
import DealersManager from "./components/DealersManager";
import MasterLedger from "./components/MasterLedger";
import CustomModal from "./components/CustomModal";
import DealTracker from "./components/DealTracker";
import VaultManager from "./components/VaultManager";

export default function App() {
  // Lang Toggle: Arabic as default, English as secondary
  const [isArabic, setIsArabic] = useState<boolean>(true);

  // Core Ledgers States
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [dealerStatements, setDealerStatements] = useState<DealerStatementItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [sales, setSaleItems] = useState<SaleItem[]>([]);
  const [expenses, setExpenses] = useState<PublicExpenseItem[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<PrivateWalletTransaction[]>([]);
  const [assayLogs, setAssayLogs] = useState<AssayLogItem[]>([]);
  const [goldOpeningBalance, setGoldOpeningBalance] = useState<number>(0);

  // Daily suggestions gold rates
  const [goldPrices, setGoldPrices] = useState<DailyGoldPrices>({
    gold24: 7028,
    gold22: 6443,
    gold21: 6150, // default reference price from initial spec
    gold18: 5271,
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "purchases" | "sales" | "dealers" | "expenses" | "ledger" | "settings" | "dealTracker" | "vault">("dashboard");

  // Custom Confirmation / Alert System
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"confirm" | "alert">("confirm");
  const [modalMessage, setModalMessage] = useState("");
  const [modalConfirmCallback, setModalConfirmCallback] = useState<(() => void) | undefined>(undefined);

  const showConfirm = (message: string, onConfirm: () => void) => {
    setModalType("confirm");
    setModalMessage(message);
    setModalConfirmCallback(() => onConfirm);
    setModalOpen(true);
  };

  const showAlert = (message: string) => {
    setModalType("alert");
    setModalMessage(message);
    setModalConfirmCallback(undefined);
    setModalOpen(true);
  };

  // Private cash vault adjustment form state (Direct deposit/withdrawal)
  const [directAmount, setDirectAmount] = useState<string>("");
  const [directDescriptionAr, setDirectDescriptionAr] = useState<string>("");
  const [directDescriptionEn, setDirectDescriptionEn] = useState<string>("");

  // Populate data on mount from LocalStorage OR Default Seeds (Empty by default for new book)
  useEffect(() => {
    setDealers(loadFromLocalStorage<Dealer[]>("pyramids_dealers", []));
    setDealerStatements(loadFromLocalStorage<DealerStatementItem[]>("pyramids_dealer_statements", []));
    setPurchases(loadFromLocalStorage<PurchaseItem[]>("pyramids_purchases", []));
    setSaleItems(loadFromLocalStorage<SaleItem[]>("pyramids_sales", []));
    setExpenses(loadFromLocalStorage<PublicExpenseItem[]>("pyramids_expenses", []));
    setWalletTransactions(loadFromLocalStorage<PrivateWalletTransaction[]>("pyramids_wallet", []));
    setAssayLogs(loadFromLocalStorage<AssayLogItem[]>("pyramids_assay_logs", []));
    setGoldOpeningBalance(loadFromLocalStorage<number>("pyramids_gold_opening_balance", 0));
    
    const savedPrices = localStorage.getItem("pyramids_gold_prices");
    if (savedPrices) {
      setGoldPrices(JSON.parse(savedPrices));
    }
  }, []);

  // Multi-Language translation index helpers
  const alt = {
    title: isArabic ? "نظام الأهرام لإدارة حسابات الذهب والششنة" : "Pyramids Gold & Assay Management System",
    subtitle: isArabic ? "بوابة حسابات المطابقة والدمغة والطهيف العينية" : "Double-Entry Assay Ledgers with Tahyeef Standardizations",
    tabDashboard: isArabic ? "لوحة المراقبة العامة" : "Dashboard Metrics",
    tabPurchases: isArabic ? "شراء الذهب (من العميل)" : "Buy Gold",
    tabSales: isArabic ? "مبيعات التجار (المقاصة)" : "Sell Gold",
    tabDealers: isArabic ? "كشوفات ذمم التجار" : "Dealers Accounts",
    tabExpenses: isArabic ? "المصروفات وفحص المعمل" : "Expenses & Tests",
    tabLedger: isArabic ? "سجل كافة العمليات" : "All Operations Log",
    tabDealTracker: isArabic ? "منظم الصفقات المزدوجة" : "Deals Settle Wizard",
    tabVault: isArabic ? "أمين الخزنة المالية" : "Treasury Safe & Capital",
    tabSettings: isArabic ? "الخزنة ونسخ الدفاتر" : "Private Vault",
    goldRefTitle: isArabic ? "أسعار غرامات الاسترشاد اليومية:" : "Reference price of gold:",
    walletBalanceLabel: isArabic ? "صندوق الخزنة الخاصة:" : "Private Box Balance:",
    depositAction: isArabic ? "إيداع كاش خاص للتمويل" : "Inject Capital (Deposit)",
    withdrawAction: isArabic ? "سحب كاش خاص للمالك" : "Withdraw Owner Dividends",
    directDescArLabel: isArabic ? "بيان الحركة (بالعربية) *" : "Arabic Memo *",
    directDescEnLabel: isArabic ? "بيان الحركة (بالإنجليزية) *" : "English Memo *",
    directAmountLabel: isArabic ? "المقدار المالي كاش *" : "Cash amount *",
    auditAlert: isArabic ? "تنبيه مطابقة الصندوق وموازين ٢١ العينية الحية" : "Live audit alignment indicator status",
    auditText: isArabic ? "النظام يسوي الحركات تلقائياً لضمان عدم تداخل مبالغ الخزنة مع أرصدة المقاصة للتاجر." : "Double entries prevent cash overlaps or discrepancies.",
  };

  // 1. ADD NEW PURCHASE (WARD / BUY FROM CUSTOMER)
  const handleAddPurchase = (newPurchase: PurchaseItem) => {
    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);
    saveToLocalStorage("pyramids_purchases", updatedPurchases);

    // Double-Entry logic to Private Wallet:
    const paymentTx: PrivateWalletTransaction = {
      id: `w_pay_${newPurchase.id}`,
      date: newPurchase.date,
      type: "purchase_payment",
      descriptionAr: `فاتورة شراء ذهب عيار ${newPurchase.detectedKarat} بوزن ${newPurchase.actualWeight} جرام من ${newPurchase.customerName} (بخصم ششنة ${newPurchase.assayFee} ج.م، الصافي المدفوع: ${newPurchase.goldValue - newPurchase.assayFee} ج.م)`,
      descriptionEn: `Paid ${newPurchase.customerName} for gold buy (${newPurchase.detectedKarat} k) weight ${newPurchase.actualWeight}g (Less Assay Fee: ${newPurchase.assayFee} EGP, Net Paid: ${newPurchase.goldValue - newPurchase.assayFee} EGP)`,
      amount: -newPurchase.goldValue // cash leaves private wallet
    };

    let updatedWallet = [paymentTx, ...walletTransactions];

    // If there is an assay fee collected:
    if (newPurchase.assayFee > 0) {
      const assayTx: PrivateWalletTransaction = {
        id: `w_assay_${newPurchase.id}`,
        date: newPurchase.date,
        type: "assay_fee_income",
        descriptionAr: `رسم تحليل ششنة مرافق للشراء من ${newPurchase.customerName}`,
        descriptionEn: `Assay fee profit linked to purchase of ${newPurchase.customerName}`,
        amount: newPurchase.assayFee // cash enters private wallet
      };

      const newAssayLog: AssayLogItem = {
        id: `al_${newPurchase.id}`,
        date: newPurchase.date,
        customerName: newPurchase.customerName,
        actualWeight: newPurchase.actualWeight,
        detectedKarat: newPurchase.detectedKarat,
        assayFee: newPurchase.assayFee
      };

      const updatedAssays = [newAssayLog, ...assayLogs];
      setAssayLogs(updatedAssays);
      saveToLocalStorage("pyramids_assay_logs", updatedAssays);

      updatedWallet = [assayTx, ...updatedWallet];
    }

    // If there is a broker fee paid:
    if (newPurchase.brokerFee > 0) {
      const brokerTx: PrivateWalletTransaction = {
        id: `w_broker_${newPurchase.id}`,
        date: newPurchase.date,
        type: "broker_fee_payment",
        descriptionAr: `عمولة حركة الصاغة المفروضة للشراء من ${newPurchase.customerName}`,
        descriptionEn: `Broker fee payment for purchase transaction linked to ${newPurchase.customerName}`,
        amount: -newPurchase.brokerFee // cash leaves private wallet
      };

      updatedWallet = [brokerTx, ...updatedWallet];
    }

    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  const handleDeletePurchase = (id: string) => {
    const updatedPurchases = purchases.filter((p) => p.id !== id);
    setPurchases(updatedPurchases);
    saveToLocalStorage("pyramids_purchases", updatedPurchases);

    // Reverse double entries in wallet and assay logs
    const updatedWallet = walletTransactions.filter(
      (w) => w.id !== `w_pay_${id}` && w.id !== `w_assay_${id}` && w.id !== `w_broker_${id}`
    );
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);

    const updatedAssays = assayLogs.filter((al) => al.id !== `al_${id}`);
    setAssayLogs(updatedAssays);
    saveToLocalStorage("pyramids_assay_logs", updatedAssays);
  };

  // 2. ADD SALE (OFFSET / SELL GOLD TO DEALER)
  const handleAddSale = (newSale: SaleItem) => {
    const updatedSales = [newSale, ...sales];
    setSaleItems(updatedSales);
    saveToLocalStorage("pyramids_sales", updatedSales);

    // Dynamic Settle and offset impact to Dealer's Ledger Statement:
    const dl = dealers.find((d) => d.id === newSale.dealerId);
    const dNameAr = dl ? dl.nameAr : "التاجر";
    const dNameEn = dl ? dl.nameEn : "Dealer";

    const dealerStatementItem: DealerStatementItem = {
      id: `ds_sale_${newSale.id}_${newSale.dealerId}`,
      date: newSale.date,
      type: "gold_sold_to_dealer",
      descriptionAr: `مقاصة تسوية ذهب عيار ${newSale.detectedKarat} بوزن ${newSale.actualWeight}g ` + 
                     (newSale.cashReceived ? `(مسدد كاش جزئياً: ${newSale.cashReceived} ج.م)` : "لتسديد السلف"),
      descriptionEn: `Delivered gold of ${newSale.detectedKarat} karat weight ${newSale.actualWeight}g` +
                     (newSale.cashReceived ? ` (partially paid: ${newSale.cashReceived} EGP)` : ""),
      cashAmount: newSale.cashReceived || 0,
      actualWeight: newSale.actualWeight,
      karatValue: newSale.detectedKarat,
      equivalentWeight21: newSale.equivalentWeight21,
      price21: newSale.price21,
      goldValue: newSale.goldValue
    };

    let updatedWallet = [...walletTransactions];
    if (newSale.cashReceived && newSale.cashReceived > 0) {
      const walletTx: PrivateWalletTransaction = {
        id: `w_sale_receipt_${newSale.id}`,
        date: newSale.date,
        type: "sale_receipt",
        descriptionAr: `مستحقات نقدية فورية من بيع ذهب للتاجر (${dNameAr})`,
        descriptionEn: `Immediate cash receipt from gold sale to ${dNameEn}`,
        amount: newSale.cashReceived
      };
      updatedWallet = [walletTx, ...updatedWallet];
      setWalletTransactions(updatedWallet);
      saveToLocalStorage("pyramids_wallet", updatedWallet);
    }

    const updatedStatements = [dealerStatementItem, ...dealerStatements];
    setDealerStatements(updatedStatements);
    saveToLocalStorage("pyramids_dealer_statements", updatedStatements);
  };

  const handleDeleteSale = (id: string) => {
    const updatedSales = sales.filter((s) => s.id !== id);
    setSaleItems(updatedSales);
    saveToLocalStorage("pyramids_sales", updatedSales);

    const updatedStatements = dealerStatements.filter((ds) => !ds.id.startsWith(`ds_sale_${id}_`));
    setDealerStatements(updatedStatements);
    saveToLocalStorage("pyramids_dealer_statements", updatedStatements);

    // Filter out wallet transaction if any
    const updatedWallet = walletTransactions.filter((w) => w.id !== `w_sale_receipt_${id}`);
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  // 3. EXPENSES INPUT
  const handleAddExpense = (newExpense: PublicExpenseItem) => {
    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    saveToLocalStorage("pyramids_expenses", updatedExpenses);

    // Outflow from private wallet Box
    const walletTx: PrivateWalletTransaction = {
      id: `w_expense_${newExpense.id}`,
      date: newExpense.date,
      type: "expense_overhead",
      descriptionAr: `مصروفات تشغيل: ${newExpense.titleAr} ${newExpense.notes ? `(${newExpense.notes})` : ""}`,
      descriptionEn: `Overhead Expense: ${newExpense.titleEn}`,
      amount: -newExpense.amount
    };

    const updatedWallet = [walletTx, ...walletTransactions];
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(updatedExpenses);
    saveToLocalStorage("pyramids_expenses", updatedExpenses);

    const updatedWallet = walletTransactions.filter((w) => w.id !== `w_expense_${id}`);
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  // 4. STANDALONE ASSAY TESTS (Testing fee collected as cash diagnostic)
  const handleAddAssayLog = (newLog: AssayLogItem) => {
    const updatedAssayLogs = [newLog, ...assayLogs];
    setAssayLogs(updatedAssayLogs);
    saveToLocalStorage("pyramids_assay_logs", updatedAssayLogs);

    // Inflow directly to Private cash wallet Box
    const walletTx: PrivateWalletTransaction = {
      id: `w_assay_standalone_${newLog.id}`,
      date: newLog.date,
      type: "assay_fee_income",
      descriptionAr: `رسم تحليل ششنة وفحص كاش منفرد للعميل ${newLog.customerName}`,
      descriptionEn: `Direct cash assay diagnostic fee from ${newLog.customerName}`,
      amount: newLog.assayFee
    };

    const updatedWallet = [walletTx, ...walletTransactions];
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  const handleDeleteAssayLog = (id: string) => {
    const updatedAssayLogs = assayLogs.filter((al) => al.id !== id);
    setAssayLogs(updatedAssayLogs);
    saveToLocalStorage("pyramids_assay_logs", updatedAssayLogs);

    const updatedWallet = walletTransactions.filter((w) => w.id !== `w_assay_standalone_${id}`);
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  // 5. DEALER CREATION & RE-ESTABLISH STATEMENTS
  const handleAddDealer = (newDealer: Dealer) => {
    const updatedDealers = [...dealers, newDealer];
    setDealers(updatedDealers);
    saveToLocalStorage("pyramids_dealers", updatedDealers);
  };

  const handleDeleteDealer = (id: string) => {
    const updatedDealers = dealers.filter((d) => d.id !== id);
    setDealers(updatedDealers);
    saveToLocalStorage("pyramids_dealers", updatedDealers);

    // Delete statement items linked with this dealer
    const updatedStatements = dealerStatements.filter(
      (ds) => !ds.id.includes(`_${id}`)
    );
    setDealerStatements(updatedStatements);
    saveToLocalStorage("pyramids_dealer_statements", updatedStatements);
  };

  const handleAddStatementItem = (newItem: DealerStatementItem) => {
    const updatedStatements = [newItem, ...dealerStatements];
    setDealerStatements(updatedStatements);
    saveToLocalStorage("pyramids_dealer_statements", updatedStatements);

    // Settle cashflows directly if they match loan received (+) or cash payouts (-) or spot cash
    if (newItem.type === "loan_received") {
      const walletTx: PrivateWalletTransaction = {
        id: `w_dealer_loan_${newItem.id}`,
        date: newItem.date,
        type: "loan_cash_received",
        descriptionAr: `استلام تمويل سلفة نقدية جارية من التاجر`,
        descriptionEn: `Received cash loan injection from dealer`,
        amount: newItem.cashAmount // positive inflow
      };

      const updatedWallet = [walletTx, ...walletTransactions];
      setWalletTransactions(updatedWallet);
      saveToLocalStorage("pyramids_wallet", updatedWallet);
    } else if (newItem.type === "loan_paid_cash") {
      const walletTx: PrivateWalletTransaction = {
        id: `w_dealer_repay_${newItem.id}`,
        date: newItem.date,
        type: "loan_cash_paid",
        descriptionAr: `سداد جزئي للسلفة النقدية كاش للتاجر`,
        descriptionEn: `Repaid cash portion of dealer loan from private wallet`,
        amount: newItem.cashAmount // negative outflow
      };

      const updatedWallet = [walletTx, ...walletTransactions];
      setWalletTransactions(updatedWallet);
      saveToLocalStorage("pyramids_wallet", updatedWallet);
    } else if (newItem.type === "gold_sold_to_dealer" && newItem.cashAmount && newItem.cashAmount > 0) {
      const walletTx: PrivateWalletTransaction = {
        id: `w_dealer_spot_${newItem.id}`,
        date: newItem.date,
        type: "sale_receipt",
        descriptionAr: `استلام كاش فوري مقابل تسليم ذهب للتاجر`,
        descriptionEn: `SPOT cash received for gold delivered to dealer`,
        amount: newItem.cashAmount
      };
      const updatedWallet = [walletTx, ...walletTransactions];
      setWalletTransactions(updatedWallet);
      saveToLocalStorage("pyramids_wallet", updatedWallet);
    } else if (newItem.type === "gold_received_from_dealer" && newItem.cashAmount && newItem.cashAmount < 0) {
      const walletTx: PrivateWalletTransaction = {
        id: `w_dealer_spot_${newItem.id}`,
        date: newItem.date,
        type: "purchase_payment",
        descriptionAr: `دفع كاش فوري مقابل استلام ذهب من التاجر`,
        descriptionEn: `SPOT cash paid for gold received from dealer`,
        amount: newItem.cashAmount // negative outflow
      };
      const updatedWallet = [walletTx, ...walletTransactions];
      setWalletTransactions(updatedWallet);
      saveToLocalStorage("pyramids_wallet", updatedWallet);
    }
  };

  const handleDeleteStatementItem = (id: string) => {
    const updatedStatements = dealerStatements.filter((ds) => ds.id !== id);
    setDealerStatements(updatedStatements);
    saveToLocalStorage("pyramids_dealer_statements", updatedStatements);

    const updatedWallet = walletTransactions.filter(
      (w) => w.id !== `w_dealer_loan_${id}` && w.id !== `w_dealer_repay_${id}` && w.id !== `w_dealer_spot_${id}`
    );
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  // 6. GOLD PRICE DIALER UPDATES
  const handleUpdatePrices = (prices: DailyGoldPrices) => {
    setGoldPrices(prices);
    localStorage.setItem("pyramids_gold_prices", JSON.stringify(prices));
  };

  const handleUpdateOpeningGold = (newVal: number) => {
    setGoldOpeningBalance(newVal);
    saveToLocalStorage("pyramids_gold_opening_balance", newVal);
  };

  // COMBINED ARBITRAGE ARABIC SYSTEM INTEGRATED POSTRUN (أحمد وأبرش ومقاصات النقد والعيار)
  const handlePostCombinedDeal = (deal: {
    buyDate: string;
    customerName: string;
    buyWeight: number;
    buyKarat: number;
    buyPrice21: number;
    assayFee: number;
    brokerFee: number;
    
    fundingDealerId: string;
    loanAmount: number;
    
    sellWeight: number;
    sellKarat: number;
    sellPrice21: number;
    dealerCashPaid: number;
  }) => {
    const buyEquiv21 = (deal.buyWeight * deal.buyKarat) / 875;
    const buyValue = buyEquiv21 * deal.buyPrice21;
    const purchaseId = `combined_buy_${Date.now()}`;
    const saleId = `combined_sell_${Date.now()}`;

    // 1. Create Purchase item
    const newPurchase: PurchaseItem = {
      id: purchaseId,
      date: deal.buyDate,
      customerName: deal.customerName,
      actualWeight: deal.buyWeight,
      detectedKarat: deal.buyKarat,
      equivalentWeight21: buyEquiv21,
      price21: deal.buyPrice21,
      goldValue: buyValue,
      assayFee: deal.assayFee,
      brokerFee: deal.brokerFee
    };

    // 2. Create companion Wallet transactions for Purchase
    const paymentTx: PrivateWalletTransaction = {
      id: `w_pay_${purchaseId}`,
      date: deal.buyDate,
      type: "purchase_payment",
      descriptionAr: `شراء ضمن صفقة مركبة عيار ${deal.buyKarat} بوزن ${deal.buyWeight}g من عابر (${deal.customerName})`,
      descriptionEn: `Composite buy karat ${deal.buyKarat} weight ${deal.buyWeight}g (${deal.customerName})`,
      amount: -buyValue
    };

    // 3. Create Companion Wallet Assay Fee transaction & Assay Log
    let updatedAssayLogs = [...assayLogs];
    let companionAssayTx: PrivateWalletTransaction | null = null;
    if (deal.assayFee > 0) {
      companionAssayTx = {
        id: `w_assay_${purchaseId}`,
        date: deal.buyDate,
        type: "assay_fee_income",
        descriptionAr: `رسم تحليل ششنة مرافق للشراء المركب من ${deal.customerName}`,
        descriptionEn: `Assay fee profit linked to purchase of ${deal.customerName}`,
        amount: deal.assayFee
      };

      const newAssayLog: AssayLogItem = {
        id: `al_${purchaseId}`,
        date: deal.buyDate,
        customerName: deal.customerName,
        actualWeight: deal.buyWeight,
        detectedKarat: deal.buyKarat,
        assayFee: deal.assayFee
      };
      updatedAssayLogs = [newAssayLog, ...updatedAssayLogs];
    }

    // 4. Create companion Wallet broker fee transaction
    let companionBrokerTx: PrivateWalletTransaction | null = null;
    if (deal.brokerFee > 0) {
      companionBrokerTx = {
        id: `w_broker_${purchaseId}`,
        date: deal.buyDate,
        type: "broker_fee_payment",
        descriptionAr: `عمولة حركة الصاغة المدفوعة للسمسار لعقد صفقة أحمد (${deal.customerName})`,
        descriptionEn: `Broker commission payment linked to purchase of ${deal.customerName}`,
        amount: -deal.brokerFee
      };
    }

    // 5. Create Dealer Cash Loan transaction in statements & Wallet
    const loanStmtId = `ds_loan_${Date.now()}`;
    const dealerLoanStmt: DealerStatementItem = {
      id: loanStmtId,
      date: deal.buyDate,
      type: "loan_received",
      descriptionAr: `تمويل سلفة سيولة نقدية فورية لإنجاز حركة الزبون عابر`,
      descriptionEn: `Dealer immediate spot liquidity loan for walk-in flow`,
      cashAmount: deal.loanAmount,
      actualWeight: 0,
      karatValue: 0,
      equivalentWeight21: 0,
      price21: 0,
      goldValue: 0
    };

    const dealerLoanWalletTx: PrivateWalletTransaction = {
      id: `w_dealer_loan_${loanStmtId}`,
      date: deal.buyDate,
      type: "loan_cash_received",
      descriptionAr: `استلام تمويل سلفة نقدية من التاجر لتمويل شراء عابر`,
      descriptionEn: `Received cash loan injection from dealer for walk-in flow`,
      amount: deal.loanAmount
    };

    // 6. Create Dealer gold sale in statements, Sales ledger & Companion Wallet spot receipt
    const sellEquiv21 = (deal.sellWeight * deal.sellKarat) / 875;
    const sellValue = sellEquiv21 * deal.sellPrice21;

    const newSaleItem: SaleItem = {
      id: saleId,
      date: deal.buyDate,
      dealerId: deal.fundingDealerId,
      actualWeight: deal.sellWeight,
      detectedKarat: deal.sellKarat,
      equivalentWeight21: sellEquiv21,
      price21: deal.sellPrice21,
      goldValue: sellValue,
      cashReceived: deal.dealerCashPaid
    };

    const dl = dealers.find((d) => d.id === deal.fundingDealerId);
    const dNameAr = dl ? dl.nameAr : "التاجر";
    const dNameEn = dl ? dl.nameEn : "Dealer";

    const dealerSaleStmt: DealerStatementItem = {
      id: `ds_sale_${saleId}_${deal.fundingDealerId}`,
      date: deal.buyDate,
      type: "gold_sold_to_dealer",
      descriptionAr: `مقاصة تسوية بيع الذهب المصفى عيار ${deal.sellKarat} بوزن ${deal.sellWeight}g للتاجر ${dNameAr}`,
      descriptionEn: `Refined gold delivered to dealer ${dNameEn} (${deal.sellWeight}g)`,
      cashAmount: deal.dealerCashPaid,
      actualWeight: deal.sellWeight,
      karatValue: deal.sellKarat,
      equivalentWeight21: sellEquiv21,
      price21: deal.sellPrice21,
      goldValue: sellValue
    };

    let dealerSaleWalletTx: PrivateWalletTransaction | null = null;
    if (deal.dealerCashPaid > 0) {
      dealerSaleWalletTx = {
        id: `w_sale_receipt_${saleId}`,
        date: deal.buyDate,
        type: "sale_receipt",
        descriptionAr: `دفعة كاش فوري من بيع الذهب المصفى للتاجر (${dNameAr})`,
        descriptionEn: `Spot cash received from refined gold sale to ${dNameEn}`,
        amount: deal.dealerCashPaid
      };
    }

    // Update States
    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);
    saveToLocalStorage("pyramids_purchases", updatedPurchases);

    const updatedSales = [newSaleItem, ...sales];
    setSaleItems(updatedSales);
    saveToLocalStorage("pyramids_sales", updatedSales);

    const updatedDealerStatements = [dealerSaleStmt, dealerLoanStmt, ...dealerStatements];
    setDealerStatements(updatedDealerStatements);
    saveToLocalStorage("pyramids_dealer_statements", updatedDealerStatements);

    setAssayLogs(updatedAssayLogs);
    saveToLocalStorage("pyramids_assay_logs", updatedAssayLogs);

    let updatedWallet = [...walletTransactions];
    updatedWallet = [paymentTx, ...updatedWallet];
    if (companionAssayTx) updatedWallet = [companionAssayTx, ...updatedWallet];
    if (companionBrokerTx) updatedWallet = [companionBrokerTx, ...updatedWallet];
    updatedWallet = [dealerLoanWalletTx, ...updatedWallet];
    if (dealerSaleWalletTx) updatedWallet = [dealerSaleWalletTx, ...updatedWallet];

    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);
  };

  // 7. DIRECT VAULT PRIVATE CASH DEPOSIT OR WITHDRAWAL (BY OWNER)
  const handleDirectCapitalChange = (type: "deposit" | "withdraw") => {
    const valueNum = Number(directAmount);
    if (valueNum <= 0) {
      showAlert(isArabic ? "برجاء توفير مقدار مالي كاش صحيح" : "Please provide a valid cash value.");
      return;
    }

    const directionSigned = type === "deposit" ? valueNum : -valueNum;
    const descAr = directDescriptionAr || (type === "deposit" ? "إيداع مالي إضافي لحساب الخزنة لحركة تداول" : "سحب أرباح أو مصروف خاص بمالك المحل");
    const descEn = directDescriptionEn || (type === "deposit" ? "Additional equity cash deposit into vault" : "Private owner withdrawal outflow");

    const newTx: PrivateWalletTransaction = {
      id: `w_manual_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: type,
      descriptionAr: descAr,
      descriptionEn: descEn,
      amount: directionSigned
    };

    const updatedWallet = [newTx, ...walletTransactions];
    setWalletTransactions(updatedWallet);
    saveToLocalStorage("pyramids_wallet", updatedWallet);

    setDirectAmount("");
    setDirectDescriptionAr("");
    setDirectDescriptionEn("");
    showAlert(isArabic ? "تم تعديل حساب صندوق المالك وقيد المعاملة!" : "Private cash ledger transactions successfully posted!");
  };

  // 7.5. WALLET UTILITIES (DELETING, CLEARING, UPDATING INDIVIDUAL TRANSACTIONS AND DIRECT VAULT OVERRIDES)
  const handleDeleteWalletTransaction = (id: string) => {
    // 1. Regular filter of the transaction from the wallet
    const updated = walletTransactions.filter((trans) => trans.id !== id);
    setWalletTransactions(updated);
    saveToLocalStorage("pyramids_wallet", updated);

    // 2. Cascade deletion to underlying modules:
    // A. Purchases / Buy Gold (links: w_pay_..., w_assay_..., w_broker_...)
    if (id.startsWith("w_pay_") || id.startsWith("w_assay_") || id.startsWith("w_broker_")) {
      const purchaseId = id
        .replace("w_pay_", "")
        .replace("w_assay_", "")
        .replace("w_broker_", "");

      // Delete the actual purchase invoice
      const updatedPurchases = purchases.filter((p) => p.id !== purchaseId);
      setPurchases(updatedPurchases);
      saveToLocalStorage("pyramids_purchases", updatedPurchases);

      // Remove all other cash ledger lines associated with this purchase (so deleting pay also deletes assay/broker rows)
      const cleanWallet = updated.filter(
        (w) => w.id !== `w_pay_${purchaseId}` && w.id !== `w_assay_${purchaseId}` && w.id !== `w_broker_${purchaseId}`
      );
      setWalletTransactions(cleanWallet);
      saveToLocalStorage("pyramids_wallet", cleanWallet);

      // Remove from assay certification log
      const updatedAssays = assayLogs.filter((al) => al.id !== `al_${purchaseId}`);
      setAssayLogs(updatedAssays);
      saveToLocalStorage("pyramids_assay_logs", updatedAssays);
    }
    // B. Operating expenses (link: w_expense_...)
    else if (id.startsWith("w_expense_")) {
      const expenseId = id.replace("w_expense_", "");
      const updatedExpenses = expenses.filter((e) => e.id !== expenseId);
      setExpenses(updatedExpenses);
      saveToLocalStorage("pyramids_expenses", updatedExpenses);
    }
    // C. Standalone diagnostic test logs (link: w_assay_standalone_...)
    else if (id.startsWith("w_assay_standalone_")) {
      const logId = id.replace("w_assay_standalone_", "");
      const updatedAssayLogs = assayLogs.filter((al) => al.id !== logId);
      setAssayLogs(updatedAssayLogs);
      saveToLocalStorage("pyramids_assay_logs", updatedAssayLogs);
    }
    // D. Dealer loans (debt credit) or cash repayments (links: w_dealer_loan_..., w_dealer_repay_...)
    else if (id.startsWith("w_dealer_loan_") || id.startsWith("w_dealer_repay_")) {
      const statementId = id
        .replace("w_dealer_loan_", "")
        .replace("w_dealer_repay_", "");
      const updatedStatements = dealerStatements.filter((ds) => ds.id !== statementId);
      setDealerStatements(updatedStatements);
      saveToLocalStorage("pyramids_dealer_statements", updatedStatements);
    }
  };

  const handleClearAllWalletTransactions = () => {
    showConfirm(
      isArabic 
        ? "تنبيه هام جداً: هل تريد تصفير السجل وإعادة تهيئة الدفاتر بالكامل للصفر؟ سيؤدي ذلك لمسح كافة المشتريات والمبيعات والمصروفات ومعاملات التجار لتصفير الخزنة والحسابات." 
        : "Important Security Alert: Are you sure you want to clear the entire log and clear the ledger book? This will permanently wipe all purchases, sales, expenses, and dealer transactions to reset everything to zero.",
      () => {
        setPurchases([]);
        setSaleItems([]);
        setExpenses([]);
        setWalletTransactions([]);
        setDealerStatements([]);
        setAssayLogs([]);
        setGoldOpeningBalance(0);

        saveToLocalStorage("pyramids_purchases", []);
        saveToLocalStorage("pyramids_sales", []);
        saveToLocalStorage("pyramids_expenses", []);
        saveToLocalStorage("pyramids_wallet", []);
        saveToLocalStorage("pyramids_dealer_statements", []);
        saveToLocalStorage("pyramids_assay_logs", []);
        saveToLocalStorage("pyramids_gold_opening_balance", 0);

        showAlert(isArabic ? "تم تصفير الدفتر بالكامل وتهيئة كافة الحسابات بنجاح!" : "Entire accounting ledger book successfully cleared and reset back to zero!");
      }
    );
  };

  const handleUpdateWalletTransaction = (updatedTx: PrivateWalletTransaction) => {
    const updated = walletTransactions.map((tx) => tx.id === updatedTx.id ? updatedTx : tx);
    setWalletTransactions(updated);
    saveToLocalStorage("pyramids_wallet", updated);
  };

  const handleAddWalletTransaction = (newTx: PrivateWalletTransaction) => {
    const updated = [newTx, ...walletTransactions];
    setWalletTransactions(updated);
    saveToLocalStorage("pyramids_wallet", updated);
  };

  // 8. DATABASE HARD RESET / CLEARALL
  const handleResetDatabase = () => {
    showConfirm(
      isArabic ? "مسح قاعدة البيانات واسترجاع الوضع التجريبي الافتراضي المعتمد؟" : "Reset entire database back to default testing seeds?",
      () => {
        setDealers(INITIAL_DEALERS);
        setDealerStatements(INITIAL_DEALER_STATEMENTS);
        setPurchases(INITIAL_PURCHASES);
        setSaleItems(INITIAL_SALES);
        setExpenses(INITIAL_EXPENSES);
        setWalletTransactions(INITIAL_PRIVATE_WALLET_TRANSACTIONS);
        setAssayLogs(INITIAL_ASSAY_LOGS);
        setGoldOpeningBalance(125.43);

        saveToLocalStorage("pyramids_dealers", INITIAL_DEALERS);
        saveToLocalStorage("pyramids_dealer_statements", INITIAL_DEALER_STATEMENTS);
        saveToLocalStorage("pyramids_purchases", INITIAL_PURCHASES);
        saveToLocalStorage("pyramids_sales", INITIAL_SALES);
        saveToLocalStorage("pyramids_expenses", INITIAL_EXPENSES);
        saveToLocalStorage("pyramids_wallet", INITIAL_PRIVATE_WALLET_TRANSACTIONS);
        saveToLocalStorage("pyramids_assay_logs", INITIAL_ASSAY_LOGS);
        saveToLocalStorage("pyramids_gold_opening_balance", 125.43);

        showAlert(isArabic ? "تم استرجاع العينات والبيانات التجريبية بنجاح!" : "Reference seed database successfully loaded!");
      }
    );
  };

  const handleClearAll = () => {
    showConfirm(
      isArabic ? "تحذير أمان: سيتم تصفير كافة المعطيات والموازين للبدء بدفاتر فارغة للعام المالي الجديد. هل توافق؟" : "Warning: Wipe all ledgers for a clean workspace first?",
      () => {
        setDealers([]);
        setDealerStatements([]);
        setPurchases([]);
        setSaleItems([]);
        setExpenses([]);
        setWalletTransactions([]);
        setAssayLogs([]);
        setGoldOpeningBalance(0);

        saveToLocalStorage("pyramids_dealers", []);
        saveToLocalStorage("pyramids_dealer_statements", []);
        saveToLocalStorage("pyramids_purchases", []);
        saveToLocalStorage("pyramids_sales", []);
        saveToLocalStorage("pyramids_expenses", []);
        saveToLocalStorage("pyramids_wallet", []);
        saveToLocalStorage("pyramids_assay_logs", []);
        saveToLocalStorage("pyramids_gold_opening_balance", 0);

        showAlert(isArabic ? "تم تصفير ومسح كافة الدفاتر وإعادة تهيئة الحسابات للصفر بنجاح!" : "All accounting ledger books successfully cleared and reset back to zero!");
      }
    );
  };

  // Compute live wallet cash representation
  const absoluteWalletCash = walletTransactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div
      id="pyramids-gold-system"
      className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* PROFESSIONAL HIGH-CONTRAST GOLD HEADER */}
      <header className="bg-slate-950 border-b border-amber-500/30 sticky top-0 z-50 px-4 py-3.5 sm:px-6 shadow-md shadow-slate-950/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* LOGO & LABELS */}
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-yellow-500 to-amber-600 rounded-lg text-slate-950 shadow-md shadow-amber-500/10">
              <Coins className="w-5.5 h-5.5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white hover:text-amber-400 transition-colors leading-none tracking-tight">
                  {alt.title}
                </h1>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8.5px] px-1.5 py-0.5 rounded-full font-black font-mono">
                  BALANCED
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{alt.subtitle}</p>
            </div>
          </div>

          {/* ACTIVE DAY SUGGESTIONS RATES */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span className="text-slate-400 font-medium">{isArabic ? "الصافي عيار ٢٤:" : "24k Pure:"}</span>
              <span className="font-mono font-bold text-amber-400">{formatCurrency(goldPrices.gold24, isArabic)}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-slate-400 font-medium">{isArabic ? "المرجع عيار ٢١:" : "Karat 21 Ref:"}</span>
              <span className="font-mono font-bold text-amber-450">{formatCurrency(goldPrices.gold21, isArabic)}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="text-slate-400 font-medium">{isArabic ? "عيار ١٨ صاغة:" : "18k Stamp:"}</span>
              <span className="font-mono font-bold text-orange-400">{formatCurrency(goldPrices.gold18, isArabic)}</span>
            </div>

            {/* BILINGUAL LANGUAGE SWITCHER */}
            <button
              onClick={() => setIsArabic(!isArabic)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-350 hover:text-white transition-colors border border-slate-800 flex items-center gap-1 text-[11px]"
              title={isArabic ? "Switch to English" : "تغيير للعربية"}
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>{isArabic ? "En" : "عرب"}</span>
            </button>
          </div>

        </div>
      </header>

      {/* SYSTEM BROADCAST NOTIFICATION */}
      <div className="bg-amber-450/5 border-b border-amber-500/10 px-4 py-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10.5px]">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{alt.auditAlert}: {formatCurrency(absoluteWalletCash, isArabic)}</span>
          </div>
          <span className="text-slate-400">{alt.auditText}</span>
        </div>
      </div>

      {/* TWO-COLUMN SIDEBAR & MAIN SHEET CONTAINER */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6">
        
        {/* SIDEBAR FOR ALL SECTIONS */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
          
          {/* SECURE TREASURY QUICK BALANCE MINI-WIDGET */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-md text-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />
            <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <span>{isArabic ? "رصيد الورشة كاش" : "TREASURY CASHBOX"}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[17px] font-mono font-black text-emerald-450 mt-1.5 truncate">
              {formatCurrency(absoluteWalletCash, isArabic)}
            </p>
            
            <button
              onClick={() => setActiveTab("vault")}
              className="mt-3.5 w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-dashed border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-[10.5px] font-black transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isArabic ? "إضافة رصيد كاش (+)" : "Top Up Cash (+)"}</span>
            </button>
          </div>

          {/* SIDEBAR NAVIGATION LINKS */}
          <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-850 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 scrollbar-none shadow-lg">
            
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-300 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <Layers className="w-4 h-4 flex-shrink-0" />
              <span>{alt.tabDashboard}</span>
            </button>

            <button
              onClick={() => setActiveTab("purchases")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === "purchases"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-300 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{alt.tabPurchases}</span>
            </button>

            <button
              onClick={() => setActiveTab("sales")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === "sales"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-300 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 text-rose-450 flex-shrink-0" />
              <span>{alt.tabSales}</span>
            </button>

            <button
              onClick={() => setActiveTab("dealTracker")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === "dealTracker"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-amber-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <Coins className="w-4 h-4 text-amber-405 flex-shrink-0" />
              <span>{alt.tabDealTracker}</span>
            </button>

            <button
              onClick={() => setActiveTab("vault")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === "vault"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                  : "text-emerald-400 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <Wallet className="w-4 h-4 flex-shrink-0" />
              <span>{alt.tabVault}</span>
            </button>

            <button
              onClick={() => setActiveTab("dealers")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === "dealers"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-300 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <UserCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>{alt.tabDealers}</span>
            </button>

            <button
              onClick={() => setActiveTab("expenses")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === "expenses"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-300 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <DollarSign className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>{alt.tabExpenses}</span>
            </button>

            <button
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === "ledger"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-300 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>{alt.tabLedger}</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === "settings"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-300 hover:text-white hover:bg-slate-900/60"
              }`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span>{alt.tabSettings}</span>
            </button>

          </div>

        </aside>

        {/* ACTIVE RAILS VIEWPORT */}
        <div id="active-tab-viewport" className="flex-1 min-w-0 transition-all duration-300">
          {activeTab === "dashboard" && (
            <DashboardOverview
              purchases={purchases}
              sales={sales}
              expenses={expenses}
              walletTransactions={walletTransactions}
              dealerStatements={dealerStatements}
              isArabic={isArabic}
              goldOpeningBalance={goldOpeningBalance}
              onUpdateOpeningGold={handleUpdateOpeningGold}
              goldPrices={goldPrices}
              onDeleteWalletTransaction={handleDeleteWalletTransaction}
              onClearWalletTransactions={handleClearAllWalletTransactions}
              onUpdateWalletTransaction={handleUpdateWalletTransaction}
              onAddWalletTransaction={handleAddWalletTransaction}
              showConfirm={showConfirm}
              showAlert={showAlert}
            />
          )}

          {activeTab === "purchases" && (
            <PurchasesManager
              purchases={purchases}
              isArabic={isArabic}
              onAddPurchase={handleAddPurchase}
              onDeletePurchase={handleDeletePurchase}
              showConfirm={showConfirm}
              showAlert={showAlert}
            />
          )}

          {activeTab === "sales" && (
            <SalesManager
              sales={sales}
              dealers={dealers}
              dealerStatements={dealerStatements}
              isArabic={isArabic}
              onAddSale={handleAddSale}
              onDeleteSale={handleDeleteSale}
              showConfirm={showConfirm}
              showAlert={showAlert}
            />
          )}

          {activeTab === "dealers" && (
            <DealersManager
              dealers={dealers}
              statementItems={dealerStatements}
              isArabic={isArabic}
              onAddDealer={handleAddDealer}
              onDeleteDealer={handleDeleteDealer}
              onAddStatementItem={handleAddStatementItem}
              onDeleteStatementItem={handleDeleteStatementItem}
              showConfirm={showConfirm}
            />
          )}

          {activeTab === "expenses" && (
            <ExpensesManager
              expenses={expenses}
              assayLogs={assayLogs}
              isArabic={isArabic}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onAddAssayLog={handleAddAssayLog}
              onDeleteAssayLog={handleDeleteAssayLog}
              showConfirm={showConfirm}
              showAlert={showAlert}
            />
          )}

          {activeTab === "ledger" && (
            <MasterLedger
              purchases={purchases}
              sales={sales}
              expenses={expenses}
              assayLogs={assayLogs}
              dealerStatements={dealerStatements}
              walletTransactions={walletTransactions}
              dealers={dealers}
              isArabic={isArabic}
              onDeletePurchase={handleDeletePurchase}
              onDeleteSale={handleDeleteSale}
              onDeleteExpense={handleDeleteExpense}
              onDeleteAssayLog={handleDeleteAssayLog}
              onDeleteStatementItem={handleDeleteStatementItem}
              onDeleteWalletTransaction={handleDeleteWalletTransaction}
              onClearLedger={handleClearAll}
              showConfirm={showConfirm}
            />
          )}

          {activeTab === "dealTracker" && (
            <DealTracker
              dealers={dealers}
              onAddDealer={handleAddDealer}
              onPostCombinedDeal={handlePostCombinedDeal}
              walletTransactions={walletTransactions}
              isArabic={isArabic}
              goldPrices={goldPrices}
              showAlert={showAlert}
            />
          )}

          {activeTab === "vault" && (
            <VaultManager
              walletTransactions={walletTransactions}
              onAddWalletTransaction={handleAddWalletTransaction}
              onDeleteWalletTransaction={handleDeleteWalletTransaction}
              isArabic={isArabic}
              showAlert={showAlert}
            />
          )}

          {activeTab === "settings" && (
            <div id="settings-view-container" className="space-y-6 animate-fade-in text-slate-100">
              
              {/* Reference Prices adjustments */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
                <h3 className="text-xs font-black text-amber-400 mb-1 flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  <span>{isArabic ? "برمجة أسعار الإرشاد لغرامات الذهب المحلية اليومية" : "Update Daily Suggestion Gold Rates"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  {isArabic 
                    ? "الأسعار المدونة هنا تستخدم كقيمة استرشادية واقتراحات نموذجية للفواتير لتسريع المعاملات." 
                    : "Used as suggestions across billing and invoicing calculators in the workshop."}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-300">
                  <div>
                    <label className="block mb-1.5 text-slate-400">{isArabic ? "عيار ٢٤ صافي" : "24k Pure"}</label>
                    <input
                      type="number"
                      value={goldPrices.gold24}
                      onChange={(e) => handleUpdatePrices({ ...goldPrices, gold24: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-400">{isArabic ? "عيار ٢٢" : "Karat 22"}</label>
                    <input
                      type="number"
                      value={goldPrices.gold22}
                      onChange={(e) => handleUpdatePrices({ ...goldPrices, gold22: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-400">{isArabic ? "عيار ٢١ مرجع" : "Karat 21 Reference"}</label>
                    <input
                      type="number"
                      value={goldPrices.gold21}
                      onChange={(e) => handleUpdatePrices({ ...goldPrices, gold21: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-slate-400">{isArabic ? "عيار ١٨ صاغة" : "Karat 18 Jewel"}</label>
                    <input
                      type="number"
                      value={goldPrices.gold18}
                      onChange={(e) => handleUpdatePrices({ ...goldPrices, gold18: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* MANUAL CAPITAL DIRECT ADJUSTMENTS FOR CASH OVERHEAD DIRECT INJECTIONS */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
                <h3 className="text-xs font-black text-amber-400 mb-1 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-500" />
                  <span>{isArabic ? "تعديل رصيد الخزنة الخاصة للمالك يدوياً" : "Direct Adjustment of Private Cash Box"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  {isArabic 
                    ? "يتيح لك هذا القسم إيداع سيولة تداول إضافية أو سحب مسحوبات شخصية من رأس المال دون التداخل مع كشوفات التجار." 
                    : "Add initial gold capital, manual cash injections, or withdraw proprietor cash dividends easily."}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-300">
                  <div>
                    <label className="block mb-1.5 text-slate-400">{alt.directAmountLabel}</label>
                    <input
                      type="number"
                      value={directAmount}
                      onChange={(e) => setDirectAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-left outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-400">{alt.directDescArLabel}</label>
                    <input
                      type="text"
                      value={directDescriptionAr}
                      onChange={(e) => setDirectDescriptionAr(e.target.value)}
                      placeholder="مثال: إيداع رأس مال افتتاح إضافي"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-amber-500 text-right"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 text-slate-400">{alt.directDescEnLabel}</label>
                    <input
                      type="text"
                      value={directDescriptionEn}
                      onChange={(e) => setDirectDescriptionEn(e.target.value)}
                      placeholder="e.g., Prop. Cash injection to fund purchase"
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex gap-2 items-end">
                    <button
                      onClick={() => handleDirectCapitalChange("deposit")}
                      type="button"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2.5 rounded transition-colors"
                    >
                      {isArabic ? "إيداع تمويل (+)" : "Deposit (+)"}
                    </button>
                    <button
                      onClick={() => handleDirectCapitalChange("withdraw")}
                      type="button"
                      className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black py-2.5 rounded transition-colors"
                    >
                      {isArabic ? "سحب حجر (-)" : "Withdraw (-)"}
                    </button>
                  </div>
                </div>
              </div>

              {/* DATA INJECTIONS & SAMPLE RECOVERY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Backups & Restore */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-amber-500" />
                      <span>{isArabic ? "النسخ الاحتياطي وتأمينات الدفاتر" : "Proprietary Local Database Backups"}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-2 p-0.5">
                      {isArabic 
                        ? "يعمل البرنامج كلياً محلياً ويخزن قواعد البيانات في المتصفح للحفاظ على أعلى مستويات الخصوصية والتكتم وسرية الموازين. يوصى بالتصدير دورياً." 
                        : "Everything runs serverless in sandbox memory ensuring absolute confidentiality. Download files to transfer them."}
                    </p>
                  </div>

                  <div className="flex gap-2.5 pt-4 text-xs font-bold">
                    <button
                      onClick={() => {
                        const backupData = {
                          dealers,
                          dealerStatements,
                          purchases,
                          sales,
                          expenses,
                          walletTransactions,
                          assayLogs,
                          exportedAt: new Date().toISOString()
                        };
                        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `نسخة_احتياطية_موازين_الأهرام_${new Date().toISOString().split("T")[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 py-2 rounded transition-colors flex items-center justify-center gap-1 font-black"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{isArabic ? "تصدير الدفاتر (.JSON)" : "Export Database"}</span>
                    </button>

                    <label className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 py-2 rounded cursor-pointer transition-colors flex items-center justify-center gap-1 font-semibold text-center">
                      <FolderOpen className="w-4 h-4 text-amber-450" />
                      <span>{isArabic ? "استيراد واستعادة" : "Import Backup"}</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const parsed = JSON.parse(event.target?.result as string);
                              if (parsed.dealers && parsed.purchases) {
                                setDealers(parsed.dealers || []);
                                setDealerStatements(parsed.dealerStatements || []);
                                setPurchases(parsed.purchases || []);
                                setSaleItems(parsed.sales || []);
                                setExpenses(parsed.expenses || []);
                                setWalletTransactions(parsed.walletTransactions || []);
                                setAssayLogs(parsed.assayLogs || []);

                                saveToLocalStorage("pyramids_dealers", parsed.dealers || []);
                                saveToLocalStorage("pyramids_dealer_statements", parsed.dealerStatements || []);
                                saveToLocalStorage("pyramids_purchases", parsed.purchases || []);
                                saveToLocalStorage("pyramids_sales", parsed.sales || []);
                                saveToLocalStorage("pyramids_expenses", parsed.expenses || []);
                                saveToLocalStorage("pyramids_wallet", parsed.walletTransactions || []);
                                saveToLocalStorage("pyramids_assay_logs", parsed.assayLogs || []);
                                showAlert(isArabic ? "تم استعادة قاعدة بيانات الأهرام بنجاح!" : "Database successfully restored!");
                              } else {
                                showAlert(isArabic ? "ملف النسخة الاحتياطية غير سليم!" : "Invalid backup file structure.");
                              }
                            } catch (err) {
                              showAlert("Failed to parse file.");
                            }
                          };
                          reader.readAsText(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Database Cleansing & Sample Recovery */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-rose-500 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-rose-500" />
                      <span>{isArabic ? "تطهير وإعادة ضبط الدفاتر المحتسبة" : "Wipe Ledgers & Clean Workspace"}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-2 p-0.5">
                      {isArabic 
                        ? "تعديل معطيات المزامنة كلياً لاستيراد العينات الرقمية للتدريب والمطابقة، أو البدء بدفاتر صاغة فارغة تماماً للعام المالي الجديد." 
                        : "Reset database back to template examples or empty all inputs for a newer accounting year."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 text-xs font-bold">
                    <button
                      onClick={handleResetDatabase}
                      className="bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 py-2 rounded transition-colors"
                    >
                      {isArabic ? "تنزيل العينات التجريبية" : "Load Reference Seeds"}
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="bg-rose-500/[0.15] hover:bg-rose-500/[0.25] text-rose-400 border border-rose-500/20 py-2 rounded transition-colors"
                    >
                      {isArabic ? "تصفير ومسح الدفاتر" : "Wipe All Databases"}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>

      {/* FOOTER GENERAL LEGALS */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 mt-12 text-center text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-medium text-slate-400">
          <p>{isArabic ? "جميع الحقوق محفوظة © الأهرام لتجارة وتعدين وششنة الذهب" : "All rights reserved © Pyramids Gold Refining Ledger Suite"}</p>
          <div className="flex gap-4 text-slate-500">
            <span>{isArabic ? "تصفية الطهيف ٢١ بالسهم المرجعي" : "Tahyeef 21 Reference systems calibrated"}</span>
            <span className="text-amber-500">★ {isArabic ? "دقة الميزان المهني" : "Professional Grade Accuracy"}</span>
          </div>
        </div>
      </footer>

      {/* GLOBAL HIGH-END CUSTOM MODAL */}
      <CustomModal
        isOpen={modalOpen}
        type={modalType}
        message={modalMessage}
        isArabic={isArabic}
        onConfirm={modalType === "confirm" ? modalConfirmCallback : undefined}
        onClose={() => setModalOpen(false)}
      />

    </div>
  );
}
