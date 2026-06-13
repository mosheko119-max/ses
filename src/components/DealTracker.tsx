import React, { useState, useEffect } from "react";
import {
  Coins,
  Scale,
  TrendingUp,
  ArrowRight,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  FolderOpen,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  UserCheck,
  Zap,
  BookOpen
} from "lucide-react";
import { Dealer, DealerStatementItem, PurchaseItem, SaleItem, PrivateWalletTransaction, DailyGoldPrices } from "../types";
import { formatCurrency, formatWeight } from "../utils";

interface DealTrackerProps {
  dealers: Dealer[];
  onAddDealer: (d: Dealer) => void;
  onPostCombinedDeal: (dealData: {
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
  }) => void;
  walletTransactions: PrivateWalletTransaction[];
  isArabic: boolean;
  goldPrices: DailyGoldPrices;
  showAlert: (msg: string) => void;
}

export default function DealTracker({
  dealers,
  onAddDealer,
  onPostCombinedDeal,
  walletTransactions,
  isArabic,
  goldPrices,
  showAlert
}: DealTrackerProps) {
  // Current datetime timestamp
  const nowStr = new Date().toISOString().substring(0, 10);

  // Phase 1 states: Customer Buy
  const [dealDate, setDealDate] = useState<string>(nowStr);
  const [customerName, setCustomerName] = useState<string>(isArabic ? "زبون صاغة عابر" : "Walk-in Guest");
  const [buyWeight, setBuyWeight] = useState<string>("46.95");
  const [buyKarat, setBuyKarat] = useState<string>("842");
  const [buyPrice21, setBuyPrice21] = useState<string>("6150");
  const [assayFee, setAssayFee] = useState<string>("200");
  const [brokerFee, setBrokerFee] = useState<string>("300");

  // Phase 2 states: Funding Sourcing
  const [fundingDealerId, setFundingDealerId] = useState<string>("");
  const [newDealerNameAr, setNewDealerNameAr] = useState<string>("");
  const [newDealerNameEn, setNewDealerNameEn] = useState<string>("");
  const [isCreatingDealer, setIsCreatingDealer] = useState<boolean>(false);

  // Phase 3 states: Refined Sale
  const [sellWeight, setSellWeight] = useState<string>("46.97");
  const [sellKarat, setSellKarat] = useState<string>("852");
  const [sellPrice21, setSellPrice21] = useState<string>("6170");

  // Phase 4 states: Spot Cash settlement
  const [dealerCashPaid, setDealerCashPaid] = useState<string>("61600");

  // Multi-step instruction expanders
  const [expandedStep, setExpandedStep] = useState<number>(1);

  // Auto select first dealer if available
  useEffect(() => {
    if (dealers.length > 0 && !fundingDealerId) {
      setFundingDealerId(dealers[0].id);
    }
  }, [dealers, fundingDealerId]);

  // Calculate current available starting cash in the main private safe wallet
  const currentWalletCash = walletTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  // MATH CALCULATIONS
  const bW = parseFloat(buyWeight) || 0;
  const bK = parseFloat(buyKarat) || 0;
  const bP = parseFloat(buyPrice21) || 0;
  const aF = parseFloat(assayFee) || 0;
  const brF = parseFloat(brokerFee) || 0;

  // 1. Buy Gold Calculations (عيار 21 المرجعي = 875 ذبابة بالتثمين المحلي)
  const buyEquiv21 = (bW * bK) / 875;
  const buyGoldValue = buyEquiv21 * bP;
  const netDueToCustomer = buyGoldValue - aF; // custom assay collected as a direct offset deduction
  const totalCashNeededToPay = netDueToCustomer + brF; // we pay customer net + broker fee from box

  // 2. Shortfall / Funding Loan Required
  const fundingShortfall = Math.max(0, totalCashNeededToPay - currentWalletCash);
  // Default cash loan to pick: if shortfall is 0, we can still post 0 or any arbitrary amount. Usually it matches exactly the shortfall.
  const loanRequiredAmount = fundingShortfall > 0 ? fundingShortfall : 270300; // default from user's case: 270300

  // 3. Sale to Dealer Calculations
  const sW = parseFloat(sellWeight) || 0;
  const sK = parseFloat(sellKarat) || 0;
  const sP = parseFloat(sellPrice21) || 0;

  const sellEquiv21 = (sW * sK) / 875;
  const sellGoldValue = sellEquiv21 * sP;

  // 4. Spot dealer cash flow & Outstanding
  const dCashPaid = parseFloat(dealerCashPaid) || 0;

  // Outstanding logic:
  // We took a loan from the dealer of size 'loanRequiredAmount'
  // We delivered gold to them of size 'sellGoldValue'
  // They paid us extra spot cash of size 'dCashPaid'
  // In the ledger, we owe the dealer 'loanRequiredAmount + dCashPaid'
  // They owe us 'sellGoldValue'
  // Net cash we owe they = (loanRequiredAmount + dCashPaid) - sellGoldValue
  // If positive, we owe the dealer cash. If negative, dealer owes us cash on credit!
  const netDealerSettlementDue = (loanRequiredAmount + dCashPaid) - sellGoldValue;

  // 5. Arbitrage & Profit leak tracking
  const goldWeightArbitrage = sellEquiv21 - buyEquiv21;
  const goldValueArbitrage = sellGoldValue - buyGoldValue;
  const netDirectArbitrageProfit = goldValueArbitrage + aF - brF; // (Sell - Buy) + AssayFeeProfit - BrokerFeePaid

  const handleCreateDealerQuick = (e: React.FormEvent) => {
    e.preventDefault();
    const nameAr = newDealerNameAr.trim();
    const nameEn = newDealerNameEn.trim() || "New Quick Dealer";
    if (!nameAr) {
      showAlert(isArabic ? "برجاء توفير اسم التاجر بالعربية" : "Please specify dealer Arabic name");
      return;
    }
    const newId = `quick_dl_${Date.now()}`;
    onAddDealer({
      id: newId,
      nameAr,
      nameEn,
    });
    setFundingDealerId(newId);
    setNewDealerNameAr("");
    setNewDealerNameEn("");
    setIsCreatingDealer(false);
  };

  const handlePostWholeDeal = () => {
    if (!fundingDealerId) {
      showAlert(isArabic ? "برجاء اختيار التاجر أولاً لتمويل وقبول الصفقة!" : "Please choose or create a dealer to post funding credit.");
      return;
    }

    onPostCombinedDeal({
      buyDate: dealDate,
      customerName,
      buyWeight: bW,
      buyKarat: bK,
      buyPrice21: bP,
      assayFee: aF,
      brokerFee: brF,
      
      fundingDealerId,
      loanAmount: loanRequiredAmount,
      
      sellWeight: sW,
      sellKarat: sK,
      sellPrice21: sP,
      dealerCashPaid: dCashPaid,
    });

    showAlert(isArabic 
      ? `🎉 تم ترحيل الصفقة المتكاملة بنجاح وعقد مقاصة نقدية وعينية للتاجر! الرصيد مسجل وتلقائي بالدفاتر وبطاقة الخزنة.` 
      : `🎉 Combined arbitrage deal cycle successfully recorded! Ledger values, wallet transactions and dealer statement updated simultaneously.`);
  };

  return (
    <div className="space-y-6">
      {/* HEADER TRIBUTE BANNER */}
      <div className="bg-gradient-to-r from-amber-600/10 via-amber-700/5 to-slate-950/40 border border-amber-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full filter blur-xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest">
              <Zap className="w-3 h-3 animate-bounce" />
              {isArabic ? "منظّم الصفقات العينية المتكامل الشامل" : "End-to-End Arbitrage Deal Suite"}
            </span>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              {isArabic ? "معالج ومقتفي حركة الصفقات والتمويل التلقائي" : "Full Deal Cycle & Arbitrage Settle Tool"}
            </h2>
            <p className="text-slate-400 text-xs max-w-2xl">
              {isArabic 
                ? "بروتوكول تفاعلي مخصص لأحمد وأبرش لتلقين الصفقات المركبة: شراء ذهب من الزبون ⇐ تمويل النقص كاش بسلفة التاجر ⇐ تطهيف وسبك العيار ⇐ مبيعات ومقاصة فورية بالخزنة مع حفظ المعلقات المستحقة تلقائياً."
                : "A custom multi-tier workbook mapping physical customer buying, spot funding loans from dealers, refining assay variances, and final cash-outs under perfect double entry balance."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex-shrink-0">
            <div className="text-right">
              <span className="block text-[9px] text-slate-500 font-bold uppercase">{isArabic ? "صندوق الورشة المتوفر حالياً" : "Current Cashbox Balance"}</span>
              <span className={`text-[15px] font-mono font-black ${currentWalletCash >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                {formatCurrency(currentWalletCash, isArabic)}
              </span>
            </div>
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Coins className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* DUAL CODES - SCENARIO STEP WORKBOOK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT WORKBOOK COLUMN: FORM INPUTS */}
        <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-amber-400" />
              {isArabic ? "تلقين مدخلات وخصومات الصفقة" : "Step-by-Step Scenario Input"}
            </h3>
            <div className="flex gap-2">
              <input
                type="date"
                value={dealDate}
                onChange={(e) => setDealDate(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 text-left"
              />
            </div>
          </div>

          {/* ACCORDION STEP 1: BUY FROM CUSTOMER */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedStep(expandedStep === 1 ? 0 : 1)}
              className="w-full text-right ltr:text-left p-3.5 flex justify-between items-center bg-slate-900 hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-450 flex items-center justify-center text-[10px] font-black font-mono">
                  1
                </span>
                <span className="text-xs font-black text-white">
                  {isArabic ? "شراء الذهب الخام ششنة من الزبون" : "Phase 1: Buy RAW Gold from Walk-In Client"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">{expandedStep === 1 ? "▲" : "▼"}</span>
            </button>

            {expandedStep === 1 && (
              <div className="p-4 border-t border-slate-850 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-300">
                <div className="md:col-span-2">
                  <label className="block mb-1 font-semibold">{isArabic ? "اسم الزبون / العابر *" : "Customer Identifier *"}</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                    placeholder={isArabic ? "امثلة: زبون عيار 842 أحمد" : "e.g. walk-in gold shop"}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold">{isArabic ? "الوزن الفعلي المستلم (جرام) *" : "Received Gold Weight (g) *"}</label>
                  <input
                    type="number"
                    step="0.001"
                    value={buyWeight}
                    onChange={(e) => setBuyWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none text-left"
                    placeholder="46.95"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold">{isArabic ? "العيار الفعلي ششنة (من 1000) *" : "Detected Karat Millesimal *"}</label>
                  <input
                    type="number"
                    value={buyKarat}
                    onChange={(e) => setBuyKarat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none text-left"
                    placeholder="842"
                  />
                  <span className="text-[9px] text-slate-500 block mt-0.5 ltr:text-left text-right">
                    {isArabic ? "سيدرج عيار عيار ٢١ المرجعي تلقائياً للتحويل" : "Ref. conversion automatically to 875 standard"}
                  </span>
                </div>

                <div>
                  <label className="block mb-1 font-semibold">{isArabic ? "سعر غرام عيار ٢١ المتفق عليه *" : "Agreed reference 21 Price *"}</label>
                  <input
                    type="number"
                    value={buyPrice21}
                    onChange={(e) => setBuyPrice21(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none text-left"
                    placeholder="6150"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold">{isArabic ? "رسوم ومستقطع تحليل الششنة (خصم) *" : "Assay Analysis Deduction (EGP) *"}</label>
                  <input
                    type="number"
                    value={assayFee}
                    onChange={(e) => setAssayFee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none text-left"
                    placeholder="200"
                  />
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between font-bold text-[11px]">
                    <span className="text-slate-400">{isArabic ? "صافي الدفع للمستلم للزبون:" : "Net Purchase Customer Pay:"}</span>
                    <span className="text-emerald-400 font-mono">
                      {formatCurrency(netDueToCustomer, isArabic)}{" "}
                      <span className="text-[9px] text-slate-500 font-semibold font-sans">
                        ({isArabic ? `${buyEquiv21.toFixed(3)}غ عيار ٢١` : `${buyEquiv21.toFixed(3)}g 21k`})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION STEP 2: FINANCING LOAN SOURCING FROM DEALER */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedStep(expandedStep === 2 ? 0 : 2)}
              className="w-full text-right ltr:text-left p-3.5 flex justify-between items-center bg-slate-900 hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center text-[10px] font-black font-mono">
                  2
                </span>
                <span className="text-xs font-black text-white">
                  {isArabic ? "تمويل السيولة الفورية بسلفة من التاجر" : "Phase 2: Funding Shortfall Setup"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">{expandedStep === 2 ? "▲" : "▼"}</span>
            </button>

            {expandedStep === 2 && (
              <div className="p-4 border-t border-slate-850 space-y-4 text-xs font-medium text-slate-300">
                <div className="bg-slate-950 p-3 rounded border border-slate-805 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">{isArabic ? "المبلغ الإجمالي المطلوب للخروج بالزبون والسمسار:" : "Total Liquidity required for buy & broker:"}</span>
                    <span className="font-mono text-white font-bold">{formatCurrency(totalCashNeededToPay, isArabic)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">{isArabic ? "المتوفر بخزنتك الحالية قبل العملية:" : "Current cashbox starting amount available:"}</span>
                    <span className="font-mono text-slate-400 font-bold">{formatCurrency(currentWalletCash, isArabic)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-850 pt-1.5 font-bold mt-1.5">
                    <span className="text-amber-400">{isArabic ? "العجز التمويلي (المطلوب سده فورا):" : "Calculated Sourcing Deficit:"}</span>
                    <span className="font-mono text-amber-400 font-black">
                      {formatCurrency(fundingShortfall, isArabic)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-semibold">{isArabic ? "عمولة سمسار مدفوعة كاش كحركة مرافقة *" : "Broker commission paid from wallet *"}</label>
                    <input
                      type="number"
                      value={brokerFee}
                      onChange={(e) => setBrokerFee(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none text-left"
                      placeholder="300"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">
                      {isArabic ? "اختيار التاجر الممول للسيولة *" : "Select Funding Dealer *"}
                    </label>
                    
                    {!isCreatingDealer ? (
                      <div className="flex gap-1.5">
                        <select
                          value={fundingDealerId}
                          onChange={(e) => setFundingDealerId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-black focus:ring-1 focus:ring-amber-500 outline-none"
                        >
                          <option value="">-- {isArabic ? "اختر تاجر ممول من قائمتك" : "Select Dealer"} --</option>
                          {dealers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {isArabic ? d.nameAr : d.nameEn}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsCreatingDealer(true)}
                          className="px-2.5 bg-amber-500 hover:bg-amber-600 rounded text-slate-950 font-bold"
                          title={isArabic ? "إنشاء تاجر جديد" : "Create Dealer"}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <div className="border border-slate-800 p-2.5 rounded bg-slate-950 space-y-2">
                        <span className="text-[10px] text-amber-400 block font-bold">{isArabic ? "إضافة سريعة لتاجر تمويل جديد:" : "Quickly create funding dealer:"}</span>
                        <input
                          type="text"
                          placeholder={isArabic ? "الاسم بالعربية *" : "Name Arabic *"}
                          value={newDealerNameAr}
                          onChange={(e) => setNewDealerNameAr(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder={isArabic ? "الاسم بالإنجليزية" : "Name English"}
                          value={newDealerNameEn}
                          onChange={(e) => setNewDealerNameEn(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white"
                        />
                        <div className="flex justify-end gap-1.5 text-[10px] pt-1">
                          <button
                            type="button"
                            onClick={handleCreateDealerQuick}
                            className="bg-emerald-500 text-slate-950 px-2 py-1 rounded font-bold"
                          >
                            {isArabic ? "موافق" : "Add"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCreatingDealer(false)}
                            className="bg-slate-800 text-slate-400 px-2 py-1 rounded"
                          >
                            {isArabic ? "لغاء" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION STEP 3: REFINED CRUSH AND SALE TO DEALER */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedStep(expandedStep === 3 ? 0 : 3)}
              className="w-full text-right ltr:text-left p-3.5 flex justify-between items-center bg-slate-900 hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-450 flex items-center justify-center text-[10px] font-black font-mono">
                  3
                </span>
                <span className="text-xs font-black text-white">
                  {isArabic ? "تطهيف الذهب وسبكه الكلي وبيعه الفوري للتاجر الممول" : "Phase 3: Refining & Casting Sale back to Funding Dealer"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">{expandedStep === 3 ? "▲" : "▼"}</span>
            </button>

            {expandedStep === 3 && (
              <div className="p-4 border-t border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-slate-300">
                <div>
                  <label className="block mb-1 font-semibold">{isArabic ? "الوزن الكلي للذهب المصبوب (غ) *" : "Refined Weight (g) *"}</label>
                  <input
                    type="number"
                    step="0.001"
                    value={sellWeight}
                    onChange={(e) => setSellWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none text-left"
                    placeholder="46.97"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 block">
                    {isArabic ? "ألفية العينة الثانية بعد الحك" : "Total weight sold to dealer"}
                  </span>
                </div>

                <div>
                  <label className="block mb-1 font-semibold">{isArabic ? "عيار الذهب المصبوب بالهندسة *" : "Casted Custom Karat *"}</label>
                  <input
                    type="number"
                    value={sellKarat}
                    onChange={(e) => setSellKarat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none text-left"
                    placeholder="852"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold">{isArabic ? "سعر غرام عيار ٢١ المتفق عليه *" : "Agreed 21k selling price *"}</label>
                  <input
                    type="number"
                    value={sellPrice21}
                    onChange={(e) => setSellPrice21(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none text-left"
                    placeholder="6170"
                  />
                </div>

                <div className="md:col-span-3 pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850 flex justify-between font-bold text-[11px]">
                    <span className="text-slate-400">{isArabic ? "إجمالي قيمة الذهب المباع والمصفى للتاجر الممول:" : "Total Gold sold value to financing dealer:"}</span>
                    <span className="text-rose-450 font-mono">
                      {formatCurrency(sellGoldValue, isArabic)}{" "}
                      <span className="text-[9px] text-slate-500 font-semibold font-sans">
                        ({isArabic ? `${sellEquiv21.toFixed(3)}غ عيار لـ٢١` : `${sellEquiv21.toFixed(3)}g 21k`})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION STEP 4: SPOT CASH SETTLEMENT FROM DEALER */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedStep(expandedStep === 4 ? 0 : 4)}
              className="w-full text-right ltr:text-left p-3.5 flex justify-between items-center bg-slate-900 hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center text-[10px] font-black font-mono">
                  4
                </span>
                <span className="text-xs font-black text-white">
                  {isArabic ? "سداد مبلغ كاش فوري إضافي من التاجر" : "Phase 4: Immediate Spot Cash Settlement from Dealer"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">{expandedStep === 4 ? "▲" : "▼"}</span>
            </button>

            {expandedStep === 4 && (
              <div className="p-4 border-t border-slate-850 space-y-4 text-xs font-medium text-slate-300">
                <p className="text-[10.5px] text-slate-400">
                  {isArabic 
                    ? "التاجر جلب كاش بقيمة السلفة لتخليص الزبون، وبعد استلام الذهب المصفى، قد يسدد مبالغ فورا كاش للورشة أو يترك الحساب معلقاً في كشوفات كشف حسابه الخاص."
                    : "The dealer provided liquidity upfront, and now bought the refined gold. Specify if they handed extra cash today (spot payment) or left it on ledger."}
                </p>

                <div>
                  <label className="block mb-1 font-semibold">{isArabic ? "مبلغ الاستلام كاش نقداً المضاف في الخزنة حالياً *" : "Immediate Cash received and loaded into safe *"}</label>
                  <input
                    type="number"
                    value={dealerCashPaid}
                    onChange={(e) => setDealerCashPaid(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono focus:ring-1 focus:ring-amber-500 outline-none text-left"
                    placeholder="61600"
                  />
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    {isArabic ? "مثال: تم إضافة 61,600 ج.م كاش فوري بالخزنة كجزء من مقاصة الذهب" : "e.g. 61,600 EGP was received and added straight away into the workshop cash desk"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            onClick={handlePostWholeDeal}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg hover:shadow-amber-500/10 flex items-center justify-center gap-2 text-xs"
          >
            <CheckCircle className="w-5 h-5 stroke-[2.5]" />
            <span>
              {isArabic 
                ? "ترحيل وتسوية كامل دورت الحركة للدفاتر والحسابات" 
                : "Post Combined Arbitrage Cycle to All Ledgers"}
            </span>
          </button>

        </div>

        {/* RIGHT AUDIT CARD COLUMN: MATHEMATICAL AUDIT TRAIL */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* LEDGER FLOW AUDIT LIVE DIAGRAM */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              {isArabic ? "التحليل المالي المزدوج والمقاصة" : "Double-Entry Settle Ledger Summary"}
            </h3>

            {/* FLOW STEPS VISUAL */}
            <div className="space-y-3.5 text-xs text-slate-300 font-medium">
              
              {/* FLOW 1 */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex flex-col gap-1 relative">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{isArabic ? "الخطوة ١: شراء الذهب" : "Step 1: Purchased Raw gold"}</span>
                <div className="flex justify-between items-baseline mt-0.5">
                  <span className="font-bold text-slate-200">{isArabic ? "شحنة الورشة من الزبون" : "Customer gold input"}</span>
                  <span className="font-mono text-emerald-400 font-bold">-{formatCurrency(netDueToCustomer, isArabic)}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>{bW}g @ {bK}k ({buyEquiv21.toFixed(3)}g 21k)</span>
                  <span>{isArabic ? `رسوم تحليل: +${aF} ج.م` : `Assay fee: +${aF}`}</span>
                </div>
              </div>

              {/* FLOW 2 */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex flex-col gap-1 relative animate-pulse">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{isArabic ? "الخطوة ٢: استيراد السيولة" : "Step 2: Liquidity funding"}</span>
                <div className="flex justify-between items-baseline mt-0.5">
                  <span className="font-bold text-slate-200">{isArabic ? "تمويل من التاجر الممول" : "Dealer Cash Infusion"}</span>
                  <span className="font-mono text-blue-400 font-bold">+{formatCurrency(loanRequiredAmount, isArabic)}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {isArabic 
                    ? `مبلغ سلفة نقدية جارية مستحقة للتاجر بالدفتر`
                    : `Current rolling cash loan recorded on dealer statement`}
                </div>
              </div>

              {/* FLOW 3 */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex flex-col gap-1 relative">
                <span className="text-[9px] font-black text-rose-450 uppercase tracking-widest">{isArabic ? "الخطوة ٣: بيع الذهب المصفى" : "Step 3: Refined gold sold back"}</span>
                <div className="flex justify-between items-baseline mt-0.5">
                  <span className="font-bold text-slate-200">{isArabic ? "مبيعات للتاجر الممول" : "Refined gold delivered"}</span>
                  <span className="font-mono text-emerald-400 font-bold">+{formatCurrency(sellGoldValue, isArabic)}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>{sW}g @ {sK}k ({sellEquiv21.toFixed(3)}g 21k)</span>
                  <span>{isArabic ? `سعر عيار ٢١: ${sP}` : `Agreed ref 21: ${sP}`}</span>
                </div>
              </div>

              {/* FLOW 4 */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex flex-col gap-1 relative">
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{isArabic ? "الخطوة ٤: تصفية الكاش الفوري" : "Step 4: Cash flow and payments"}</span>
                <div className="flex justify-between items-baseline mt-0.5">
                  <span className="font-bold text-slate-200">{isArabic ? "كاش مستلم فورا من التاجر بالحقيبة" : "Extra spot cash received"}</span>
                  <span className="font-mono text-amber-400 font-bold">+{formatCurrency(dCashPaid, isArabic)}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {isArabic ? "سيتم إيداعها مباشرة بالخزنة وتحديث السيولة الكلية" : "Total immediate cash added into the active shop register"}
                </div>
              </div>

            </div>
          </div>

          {/* DEALER OUTSTANDING CALCULATOR SCREEN */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-400" />
              {isArabic ? "رصد مديونية المعلقات الجارية مع التاجر" : "Current Dealer Rollover Balance Owed"}
            </h3>

            <div className="space-y-3 font-semibold text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">{isArabic ? "مجموع مساهمة كاش التاجر الكلي:" : "Total Cash dealer funded today:"}</span>
                <span className="font-mono text-white">{(loanRequiredAmount + dCashPaid).toLocaleString()} ج.م</span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">{isArabic ? "مجموع الذهب المسلّم عيار لـ٢١ للتاجر:" : "Total Gold weight delivered (21k value):"}</span>
                <span className="font-mono text-amber-400">{sellGoldValue.toLocaleString()} ج.م</span>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col py-3">
                <span className="text-[9px] text-slate-500 font-black uppercase block tracking-wider">
                  {isArabic ? "رصيد المطابقة وكشوف التاجر المتبقية" : "Post-Transaction Ledger Balance Owed"}
                </span>
                
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-slate-300 font-bold">
                    {netDealerSettlementDue >= 0 
                      ? (isArabic ? "عليك للتاجر (ديون سلف):" : "Owed to Dealer (Debt):")
                      : (isArabic ? "لك عند التاجر (مستحق):" : "Owed by Dealer (Receivables):")
                    }
                  </span>
                  <span className={`text-[15px] font-mono font-black ${netDealerSettlementDue >= 0 ? "text-rose-500" : "text-emerald-400"}`}>
                    {formatCurrency(Math.abs(netDealerSettlementDue), isArabic)}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 mt-1">
                  {netDealerSettlementDue >= 0 ? (
                    isArabic 
                      ? "الدورة متزنة، ومطلوب تسديد هذا المبلغ لاحقاً للتاجر ككاش سلف." 
                      : "Balance must be returned to dealer as cash loan payoff later."
                  ) : (
                    isArabic 
                      ? "التاجر عليه تقديم كاش إضافي لك لتغطية فرق قيمة الذهب." 
                      : "Dealer must bring you the remainder cash to balance his gold purchase."
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* METRIC CARD: TOTAL ESTIMATED TRANSACTION ARBITRAGE PROFIT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  {isArabic ? "الأرباح والمكاسب المتوقعة من دقة الصفقة" : "Simulated Net Venture Yield"}
                </p>
                <h3 className="text-xl font-mono font-black text-emerald-400 mt-1">
                  +{formatCurrency(netDirectArbitrageProfit, isArabic)}
                </h3>
              </div>
              <span className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-[10.5px] text-slate-400">
              <div className="flex justify-between font-medium">
                <span>{isArabic ? "أرباح فرق تصفية الذهب عيني عيار ٢١:" : "Gain of Purity refinement weight:"}</span>
                <span className="font-mono text-amber-400 font-bold">+{goldWeightArbitrage.toFixed(3)}g 21k ({isArabic ? "زادت موازين" : "weight grew"})</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{isArabic ? "أرباح فرق تسعير الجرام (٦١٥٠ ⇐ ٦١٧٠):" : "Gain from 21k Price Spread (6150 vs 6170):"}</span>
                <span className="font-mono text-emerald-450">+{formatCurrency(goldValueArbitrage, isArabic)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-slate-850 text-slate-500 text-[10px]">
                <span>{isArabic ? "صافي الربح المتكامل بالصندوق:" : "Net direct cash flow profitability:"}</span>
                <span className="font-mono text-slate-300">{(netDirectArbitrageProfit).toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
