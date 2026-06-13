import React, { useState } from "react";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Minus,
  Coins,
  History,
  Trash2,
  Calendar,
  Layers,
  Search,
  SlidersHorizontal,
  CheckCircle,
  HelpCircle,
  Info
} from "lucide-react";
import { PrivateWalletTransaction } from "../types";
import { formatCurrency } from "../utils";

interface VaultManagerProps {
  walletTransactions: PrivateWalletTransaction[];
  onAddWalletTransaction: (tx: PrivateWalletTransaction) => void;
  onDeleteWalletTransaction: (id: string) => void;
  isArabic: boolean;
  showAlert: (msg: string) => void;
}

export default function VaultManager({
  walletTransactions,
  onAddWalletTransaction,
  onDeleteWalletTransaction,
  isArabic,
  showAlert
}: VaultManagerProps) {
  // Deposit / Withdraw form state
  const [transType, setTransType] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState<string>("");
  const [descAr, setDescAr] = useState<string>("");
  const [descEn, setDescEn] = useState<string>("");
  const [transDate, setTransDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");

  // Sum up all cash transactions to display the absolute real-time cash balance
  const totalCashBalance = walletTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  // Filters for displaying previous transactions
  // Let's filter out only manually entered deposits/withdrawals, or just show all private vault logs
  const filteredTransactions = walletTransactions.filter((tx) => {
    // Filter by search text
    const textToMatchAr = tx.descriptionAr?.toLowerCase() || "";
    const textToMatchEn = tx.descriptionEn?.toLowerCase() || "";
    const matchSearch =
      textToMatchAr.includes(searchQuery.toLowerCase()) ||
      textToMatchEn.includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery);

    // Filter by type
    if (filterType === "all") return matchSearch;
    if (filterType === "deposit") return tx.amount > 0 && matchSearch;
    if (filterType === "withdraw") return tx.amount < 0 && matchSearch;
    return matchSearch;
  });

  // Hot Presets for Quick Deposit
  const presets = [1000, 5000, 10000, 50000, 100000, 250000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      showAlert(
        isArabic
          ? "الرجاء تحديد مبلغ مالي صحيح أكبر من الصفر!"
          : "Please enter a valid cash amount greater than zero."
      );
      return;
    }

    const directionSigned = transType === "deposit" ? parsedAmount : -parsedAmount;

    // Build descriptions if empty
    const finalDescAr =
      descAr.trim() ||
      (transType === "deposit"
        ? `شحن السيولة - إيداع نقدي بالخزنة`
        : `مسحوبات نقدية - سحب كاش من الخزنة`);

    const finalDescEn =
      descEn.trim() ||
      (transType === "deposit"
        ? `Manual cash capital deposit`
        : `Manual cash withdrawal`);

    const newTx: PrivateWalletTransaction = {
      id: `w_manual_${Date.now()}`,
      date: transDate,
      type: transType,
      descriptionAr: finalDescAr,
      descriptionEn: finalDescEn,
      amount: directionSigned
    };

    onAddWalletTransaction(newTx);
    showAlert(
      isArabic
        ? `✅ تم قيد حركة ${transType === "deposit" ? "إيداع" : "سحب"} بقيمة ${formatCurrency(parsedAmount, true)} بنجاح!`
        : `✅ Successfully recorded ${transType} of ${formatCurrency(parsedAmount, false)}!`
    );

    // Reset fields
    setAmount("");
    setDescAr("");
    setDescEn("");
  };

  const handleApplyPreset = (val: number) => {
    setAmount(val.toString());
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION BANNER HERO WITH METRICS */}
      <div className="bg-gradient-to-r from-emerald-600/10 via-emerald-700/5 to-slate-950/40 border border-emerald-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
              <Wallet className="w-3 h-3 text-emerald-400" />
              {isArabic ? "إدارة وتغذية سيولة الصندوق" : "TREASURY & LIQUIDITY INJECTIONS"}
            </span>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Coins className="w-5.5 h-5.5 text-emerald-400" />
              {isArabic ? "مستوى رصيد الخزنة الفورية والودائع" : "Active Cash safe and capital depot"}
            </h2>
            <p className="text-slate-400 text-xs max-w-2xl">
              {isArabic
                ? "هذه هي الخزنة المالية المحورية للورشة. أضف رصيداً لتغطية حركات الشراء ودفع عمولات السماسرة ومصاريف المحل، أو اسحب أرباحاً مع تمسّك الدفاتر بالمبدأ المحاسبي المزدوج الذكي تلقائياً."
                : "This is the secure cash registry. Top up to fund walk-in purchases, settle dealer balances, pay operating expenses, or record direct owner drawings safely."}
            </p>
          </div>

          {/* LARGE DIGITAL BALANCES BOARD */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4.5 flex-shrink-0 flex items-center gap-4 shadow-xl">
            <div className="text-right">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {isArabic ? "مجموع الرصيد المتاح حالياً بالخزنة" : "ACTIVE TREASURY CASH BALANCE"}
              </span>
              <span className={`text-2xl font-mono font-black tracking-tight ${totalCashBalance >= 0 ? "text-emerald-400" : "text-rose-500 animate-pulse"}`}>
                {formatCurrency(totalCashBalance, isArabic)}
              </span>
              <div className="text-[10px] text-slate-400 mt-1">
                {isArabic ? "متزنة بالكامل مع كافة الفاتر والكشوف" : "Perfectly balanced across all ledger sheets"}
              </div>
            </div>
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Wallet className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ADD FUNDS FORM WITH PRESETS */}
        <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="p-1 bg-emerald-500/10 rounded text-emerald-400"><Plus className="w-3.5 h-3.5" /></span>
              {isArabic ? "تعديل رصيد الخزنة (كاش)" : "Modify Safe Cash Balance"}
            </h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold">
              {isArabic ? "حركة مالية مزدوجة" : "Direct balance override"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-slate-300">
            {/* Direct Transaction Direction Toggle */}
            <div>
              <label className="block mb-1.5 font-bold text-slate-400">
                {isArabic ? "نوع المعاملة بالخزنة *" : "Wallet action type *"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransType("deposit")}
                  className={`py-2 px-3 rounded-lg font-black flex items-center justify-center gap-2 border transition-all ${
                    transType === "deposit"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                  <span>{isArabic ? "إضافة رصيد (إيداع)" : "Add Balance (Deposit)"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransType("withdraw")}
                  className={`py-2 px-3 rounded-lg font-black flex items-center justify-center gap-2 border transition-all ${
                    transType === "withdraw"
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-450"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4 text-rose-550" />
                  <span>{isArabic ? "سحب رصيد (سحب)" : "Outflow (Withdraw)"}</span>
                </button>
              </div>
            </div>

            {/* Cash Input */}
            <div>
              <label className="block mb-1.5 font-bold text-slate-400">
                {isArabic ? "المقدار المالي (بالجنيه المصري) *" : "Cash Amount (EGP) *"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono font-black focus:ring-1 focus:ring-emerald-500 outline-none text-left"
                  placeholder="e.g. 50000"
                  required
                />
                <span className="absolute right-3.5 top-3 text-slate-500 font-bold">
                  {isArabic ? "ج.م" : "EGP"}
                </span>
              </div>
            </div>

            {/* QUICK PRESETS INJECTIONS */}
            <div>
              <label className="block mb-1.5 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                {isArabic ? "مبالغ سريعة جاهزة للشحن:" : "Quick Balance Presets:"}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-1 px-2.5 bg-slate-900 border border-slate-800/80 rounded-lg hover:border-emerald-500/30 font-mono text-[11px] text-amber-450/90 font-black hover:text-white transition-all text-center"
                  >
                    +{preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block mb-1.5 font-bold text-slate-400">
                {isArabic ? "تاريخ تسجيل الحركة *" : "Accounting Date *"}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={transDate}
                  onChange={(e) => setTransDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono focus:ring-1 focus:ring-emerald-500 outline-none text-left"
                  required
                />
              </div>
            </div>

            {/* Descriptions Ar */}
            <div>
              <label className="block mb-1 font-bold text-slate-400">
                {isArabic ? "بيان الحركة (بالعربية) *" : "Description (Arabic) *"}
              </label>
              <input
                type="text"
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                placeholder={
                  isArabic
                    ? transType === "deposit"
                      ? "مثال: رأس مال إضافي من الشريك أحمد"
                      : "مثال: مسحوبات شخصية لشراء دواء أو مصروفات"
                    : "Arabic brief description"
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Descriptions En */}
            <div>
              <label className="block mb-1 font-bold text-slate-400">
                {isArabic ? "البيان بالإنجليزية (اختياري)" : "Description (English - Optional)"}
              </label>
              <input
                type="text"
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="e.g. cash pool capital injection"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className={`w-full font-black py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider text-slate-950 ${
                transType === "deposit"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-605 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/10"
                  : "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 hover:shadow-rose-500/10"
              }`}
            >
              {transType === "deposit" ? <Plus className="w-4 h-4 stroke-[3]" /> : <Minus className="w-4 h-4 stroke-[3]" />}
              <span>
                {isArabic
                  ? `${transType === "deposit" ? "ترحيل إيداع الكاش فورا" : "ترحيل سحب الكاش فورا"}`
                  : `Post ${transType} into safe`}
              </span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: HISTORICAL LIST INTEGRITY WITH SEARCH */}
        <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              {isArabic ? "سجل تحركات الخزنة والودائع الحرة" : "Historical Safe Ledger Entries"}
            </h3>
            
            {/* Filter Buttons */}
            <div className="flex gap-1.5 text-[10px]">
              <button
                onClick={() => setFilterType("all")}
                className={`py-1 px-2.5 rounded font-bold ${
                  filterType === "all" ? "bg-slate-800 text-white" : "bg-slate-900/60 text-slate-400"
                }`}
              >
                {isArabic ? "الكل" : "All"}
              </button>
              <button
                onClick={() => setFilterType("deposit")}
                className={`py-1 px-2.5 rounded font-bold ${
                  filterType === "deposit" ? "bg-emerald-500/20 text-emerald-450 border border-emerald-500/20" : "bg-slate-900/60 text-slate-405"
                }`}
              >
                {isArabic ? "إيداعات" : "Deposits"}
              </button>
              <button
                onClick={() => setFilterType("withdraw")}
                className={`py-1 px-2.5 rounded font-bold ${
                  filterType === "withdraw" ? "bg-rose-500/20 text-rose-450 border border-rose-500/20" : "bg-slate-900/60 text-slate-405"
                }`}
              >
                {isArabic ? "مسحوبات" : "Draws"}
              </button>
            </div>
          </div>

          {/* Search Box inputs */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 pl-9 pr-9 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-700"
              placeholder={isArabic ? "ابحث في البيان، القيمة، التاريخ بالصندوق..." : "Search memo, date, or amount..."}
            />
            <Search className={`w-4 h-4 text-slate-500 absolute top-2.5 ${isArabic ? "right-3" : "left-3"}`} />
          </div>

          {/* TRANSACTIONS SCROLLBOX */}
          <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl space-y-2">
                <Info className="w-5 h-5 text-slate-600 mx-auto" />
                <p>{isArabic ? "لم يتم العثور على أي حركات خزنة تسابق البحث" : "No matching wallet transactions found."}</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isDeposit = tx.amount >= 0;
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-between gap-3 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-2 rounded-lg flex-shrink-0 ${isDeposit ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-450"}`}>
                        {isDeposit ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                      </span>

                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 truncate">
                          {isArabic ? tx.descriptionAr : tx.descriptionEn}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-0.5"><Calendar className="w-3.5 h-3.5" />{tx.date}</span>
                          <span className="bg-slate-950 px-1.5 py-0.25 rounded text-amber-500 font-mono text-[9px] uppercase tracking-wider">
                            {tx.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`font-mono font-black ${isDeposit ? "text-emerald-400" : "text-rose-450"}`}>
                        {isDeposit ? "+" : ""}{tx.amount.toLocaleString()} {isArabic ? "ج.م" : "EGP"}
                      </span>

                      {/* Manual safety actions limit deletes to manual items */}
                      {tx.id.startsWith("w_manual_") && (
                        <button
                          onClick={() => {
                            if (confirm(isArabic ? "هل أنت متأكد من رغبتك في حذف حركة الخزنة هذه؟ لا يمكن التراجع." : "Confirm deletion of this safe entry?")) {
                              onDeleteWalletTransaction(tx.id);
                            }
                          }}
                          className="p-1 px-1.5 bg-slate-950 hover:bg-rose-950/40 rounded border border-slate-800 text-slate-500 hover:text-rose-450 transition-colors"
                          title={isArabic ? "حذف الحركة" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
