/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Dealer, DealerStatementItem } from "../types";
import { formatCurrency, formatWeight, calculateEquivalentWeight } from "../utils";
import { Plus, User, FileText, Phone, DollarSign, Scale, ArrowDownRight, ArrowUpLeft, Trash2 } from "lucide-react";

interface DealersManagerProps {
  dealers: Dealer[];
  statementItems: DealerStatementItem[];
  isArabic: boolean;
  onAddDealer: (dealer: Dealer) => void;
  onDeleteDealer: (id: string) => void;
  onAddStatementItem: (item: DealerStatementItem) => void;
  onDeleteStatementItem: (id: string) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

export default function DealersManager({
  dealers,
  statementItems,
  isArabic,
  onAddDealer,
  onDeleteDealer,
  onAddStatementItem,
  onDeleteStatementItem,
  showConfirm,
}: DealersManagerProps) {
  const [selectedDealerId, setSelectedDealerId] = useState<string>(dealers[0]?.id || "");

  // Sync selectedDealerId if the list of dealers changes or if the current choice is not valid
  React.useEffect(() => {
    if (dealers.length > 0) {
      const exists = dealers.some((d) => d.id === selectedDealerId);
      if (!exists) {
        setSelectedDealerId(dealers[0].id);
      }
    } else {
      setSelectedDealerId("");
    }
  }, [dealers, selectedDealerId]);
  
  // Dealer form
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [phone, setPhone] = useState("");

  // Statement adjustment form
  const [adjType, setAdjType] = useState<"loan_received" | "loan_paid_cash" | "gold_sold_to_dealer" | "gold_received_from_dealer">("loan_received");
  const [adjCash, setAdjCash] = useState("");
  const [adjWeight, setAdjWeight] = useState("");
  const [adjKarat, setAdjKarat] = useState("875"); // Default 21 or 875
  const [adjPrice, setAdjPrice] = useState("");
  const [descAr, setDescAr] = useState("");
  const [descEn, setDescEn] = useState("");

  const handleCreateDealer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !nameEn) return;
    const newDealer: Dealer = {
      id: "d_" + Date.now(),
      nameAr,
      nameEn,
      phone: phone || undefined,
    };
    onAddDealer(newDealer);
    setSelectedDealerId(newDealer.id);
    setNameAr("");
    setNameEn("");
    setPhone("");
  };

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealerId) return;

    let finalWeight = Number(adjWeight || 0);
    let finalCash = Number(adjCash || 0);
    const karat = Number(adjKarat || 875);
    const price = Number(adjPrice || 0);

    let calculatedEquiv = 0;
    let goldValue = 0;

    if (adjType === "gold_sold_to_dealer" || adjType === "gold_received_from_dealer") {
      calculatedEquiv = calculateEquivalentWeight(finalWeight, karat);
      goldValue = Math.round(calculatedEquiv * price);
    }

    // Sign weight and cash according to direction
    // In statement:
    // loan_received: cash received (+), gold (0)
    // loan_paid_cash: cash paid/returned (-), gold (0)
    // gold_sold_to_dealer: cash (+) representing payment received, gold delivered (+)
    // gold_received_from_dealer: cash (-) representing payment paid, gold received (-)
    let signedActualWeight = finalWeight;
    let signedEquivWeight = calculatedEquiv;
    let signedCash = finalCash;

    if (adjType === "gold_received_from_dealer") {
      signedActualWeight = -finalWeight;
      signedEquivWeight = -calculatedEquiv;
      signedCash = -finalCash; // negative represent payment we paid on the spot
    }
    if (adjType === "loan_paid_cash") {
      signedCash = -finalCash;
    }

    const defaultDescAr = 
      adjType === "loan_received" ? `سلفة نقدية جارية بقيمة ${finalCash} ج.م` :
      adjType === "loan_paid_cash" ? `سداد جزء من السلفة نقداً بقيمة ${finalCash} ج.م` :
      adjType === "gold_sold_to_dealer" ? `تسليم مبيع ذهب عيار ${karat} بوزن ${finalWeight} جرام` :
      `استلام ذهب عيار ${karat} بوزن ${finalWeight} جرام من التاجر`;

    const defaultDescEn = 
      adjType === "loan_received" ? `Received cash loan of ${finalCash} EGP` :
      adjType === "loan_paid_cash" ? `Paid cash return of ${finalCash} EGP` :
      adjType === "gold_sold_to_dealer" ? `Delivered gold of ${karat} karat weight ${finalWeight}g` :
      `Received gold of ${karat} karat weight ${finalWeight}g from dealer`;

    // Add identifier to keep statementItems linked to this dealer
    const newItem: DealerStatementItem = {
      id: "ds_" + Date.now() + "_" + selectedDealerId, // Encode dealer link
      date: new Date().toISOString().split("T")[0],
      type: adjType,
      descriptionAr: descAr || defaultDescAr,
      descriptionEn: descEn || defaultDescEn,
      cashAmount: signedCash,
      actualWeight: signedActualWeight,
      karatValue: karat,
      equivalentWeight21: signedEquivWeight,
      price21: price,
      goldValue: goldValue,
    };

    onAddStatementItem(newItem);
    setAdjCash("");
    setAdjWeight("");
    setAdjKarat("875");
    setAdjPrice("");
    setDescAr("");
    setDescEn("");
  };

  // Filter items linked to selected dealer
  const currentDealer = dealers.find((d) => d.id === selectedDealerId);
  const currentItems = statementItems.filter(
    (item) => item.id.includes(`_${selectedDealerId}`) || (selectedDealerId === "d1" && item.id.startsWith("ds_"))
  );

  // Dealer financial aggregates
  let totalCashLoans = 0; // Cumulative loans we got
  let totalCashPaid = 0;  // Cumulative cash repaid
  let totalWeightDelivered = 0; // Cumulative weight 21 we sold/delivered to dealer
  let totalWeightReceived = 0;  // Cumulative weight 21 we got from dealer
  let totalGoldValueDelivered = 0; // Cumulative value of sold/delivered gold (representing credit to us)
  let totalGoldValueReceived = 0;  // Cumulative value of got/received gold (representing debt to us)
  let totalCashReceivedFromDeals = 0; // Cumulative cash paid by dealer to us for sold gold
  let totalCashPaidForDeals = 0; // Cumulative cash we paid to dealer for received gold

  currentItems.forEach((item) => {
    if (item.type === "loan_received") {
      totalCashLoans += item.cashAmount;
    } else if (item.type === "loan_paid_cash") {
      totalCashPaid += Math.abs(item.cashAmount);
    } else if (item.type === "gold_sold_to_dealer") {
      totalWeightDelivered += Math.abs(item.equivalentWeight21);
      totalGoldValueDelivered += item.goldValue || 0;
      totalCashReceivedFromDeals += item.cashAmount || 0;
    } else if (item.type === "gold_received_from_dealer") {
      totalWeightReceived += Math.abs(item.equivalentWeight21);
      totalGoldValueReceived += item.goldValue || 0;
      totalCashPaidForDeals += Math.abs(item.cashAmount || 0);
    }
  });

  // Unified outstanding cash debt representation
  const outstandingCashDebt = 
    totalCashLoans 
    - totalCashPaid 
    - totalGoldValueDelivered 
    + totalCashReceivedFromDeals 
    + totalGoldValueReceived 
    - totalCashPaidForDeals;

  const outstandingGoldBalance = totalWeightDelivered - totalWeightReceived; // positive means they owe us gold

  return (
    <div id="dealer-ledger-manager" className="space-y-6 animate-fade-in" dir={isArabic ? "rtl" : "ltr"}>
      {/* Dynamic Dealer selector tab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RIGHT/LEFT PANELS: Create Dealer */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {isArabic ? "تسجيل تاجر جديد في النظام" : "Register New Gold Dealer"}
            </h3>
            
            <form onSubmit={handleCreateDealer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isArabic ? "اسم التاجر (بالعربية) *" : "Dealer Name (Arabic) *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isArabic ? "مثال: مصفاة المحبة للذهب" : "e.g., Al Mahabba Refinery"}
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isArabic ? "اسم التاجر (بالإنجليزية) *" : "Dealer Name (English) *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pyramids Gold Dealer"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isArabic ? "رقم الهاتف / الاتصال" : "Phone / Contact Number"}
                </label>
                <input
                  type="text"
                  placeholder="010xxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
              >
                <User className="w-4 h-4" />
                <span>{isArabic ? "إضافة التاجر الحالي" : "Add Dealer Record"}</span>
              </button>
            </form>
          </div>

          {/* Quick dealer list & statement selectors */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              {isArabic ? "قائمة التجار المعتمدين" : "Authorized Dealers List"}
            </h3>
            
            {dealers.length === 0 ? (
              <p className="text-xs text-slate-500">
                {isArabic ? "لا يوجد تجار مسجلين حالياً." : "No registered dealers."}
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dealers.map((d) => {
                  const isActive = d.id === selectedDealerId;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDealerId(d.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${
                        isActive
                          ? "bg-amber-500/10 border-amber-500 text-white"
                          : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs">{isArabic ? d.nameAr : d.nameEn}</p>
                        {d.phone && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{d.phone}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirm(
                              isArabic ? "هل أنت متأكد من حذف هذا التاجر وكافة كشوفاته التابعة؟" : "Are you sure you want to delete this dealer?",
                              () => {
                                onDeleteDealer(d.id);
                                if (selectedDealerId === d.id) {
                                  setSelectedDealerId(dealers.find((dl) => dl.id !== d.id)?.id || "");
                                }
                              }
                            );
                          }}
                          className="p-1 hover:text-rose-500 text-slate-500 transition-colors"
                          title={isArabic ? "حذف التاجر" : "Delete Dealer"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className={`w-2 h-2 rounded-full ${isActive ? "bg-amber-500" : "bg-slate-600"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LEDGER DETAILS PANEL */}
        <div className="lg:col-span-8 space-y-6">
          {currentDealer ? (
            <>
              {/* LEDGER STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {isArabic ? "المعلقات غرامات ذهب (عيار 21)" : "Outstanding Gold Balance (21g)"}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-lg font-mono font-black ${outstandingGoldBalance >= 0 ? "text-amber-400" : "text-rose-500"}`}>
                      {formatWeight(outstandingGoldBalance, isArabic)}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">
                    {outstandingGoldBalance >= 0 
                      ? (isArabic ? "طلب طرف التاجر مسلم" : "Due from dealer") 
                      : (isArabic ? "مسحوبات مستلمة من التاجر" : "Owed to dealer")}
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {outstandingCashDebt >= 0 
                      ? (isArabic ? "السلفيات النقدية الجارية (عليك)" : "Current Cash Loans (Owed)")
                      : (isArabic ? "الأرصدة النقدية المستحقة (لك)" : "Outstanding Receivables (Due)")}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-lg font-mono font-black ${outstandingCashDebt > 0 ? "text-rose-500" : "text-emerald-400"}`}>
                      {formatCurrency(Math.abs(outstandingCashDebt), isArabic)}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">
                    {outstandingCashDebt > 0
                      ? (isArabic ? "مبالغ نقدية عليك سدادها للتاجر" : "Cash loans owed to this dealer")
                      : (outstandingCashDebt < 0
                        ? (isArabic ? "رصيد كاش متبقي مستحق لك طرف التاجر" : "Remaining cash due from dealer")
                        : (isArabic ? "الحساب النقدي متزن تماماً" : "Purely balanced cash status"))}
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {isArabic ? "المقاصة الإجمالية الصافية" : "Total Net Settle Balance"}
                  </span>
                  <div className="mt-2">
                    <p className="text-[10px] text-slate-300">
                      {isArabic ? "مكافئ الذهب بالمال:" : "Gold value equivalent:"}
                      <span className="font-mono font-bold text-amber-500 ml-1">
                        {formatCurrency(outstandingGoldBalance * 6170, isArabic)}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-300 mt-1">
                      {isArabic ? "الصافي النهائي:" : "Absolute Net (Gold vs Loan):"}
                      <span className={`font-mono font-bold ml-1 ${((outstandingGoldBalance * 6170) - outstandingCashDebt) >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                        {formatCurrency((outstandingGoldBalance * 6170) - outstandingCashDebt, isArabic)}
                      </span>
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">
                    {isArabic ? "تحت سعر الموازنة الجاري (6170 ج.م)" : "Calculated using market value 6170/g"}
                  </span>
                </div>
              </div>

              {/* RECORD LEADER STATEMENT MANUAL ADJUSTMENT */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                  {isArabic ? "تحرير حركة يدوية بكشف حساب" : "Post Transaction to Dealer Ledger"} - {isArabic ? currentDealer.nameAr : currentDealer.nameEn}
                </h3>

                <form onSubmit={handleCreateAdjustment} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs font-medium text-slate-300">
                  <div>
                    <label className="block mb-1">{isArabic ? "نوع الحركة" : "Entry Type"}</label>
                    <select
                      value={adjType}
                      onChange={(e: any) => {
                        setAdjType(e.target.value);
                        setAdjCash("");
                        setAdjWeight("");
                        setAdjPrice("");
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="loan_received">{isArabic ? "استلام سلفة نقدية (+)" : "Receive Cash Loan (+)"}</option>
                      <option value="loan_paid_cash">{isArabic ? "سداد سلفة نقدية (-)" : "Pay Back Loan (-)"}</option>
                      <option value="gold_sold_to_dealer">{isArabic ? "تسليم ذهب للتاجر (+)" : "Deliver Gold to Dealer (+)"}</option>
                      <option value="gold_received_from_dealer">{isArabic ? "استلام ذهب من التاجر (-)" : "Receive Gold from Dealer (-)"}</option>
                    </select>
                  </div>

                  {(adjType === "loan_received" || adjType === "loan_paid_cash") ? (
                    <div className="md:col-span-4">
                      <label className="block mb-1">{isArabic ? "المبلغ المالي (ج.م) *" : "Cash Amount (EGP) *"}</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="0.00"
                        value={adjCash}
                        onChange={(e) => setAdjCash(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-705 rounded p-1.5 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block mb-1">{isArabic ? "الوزن الفعلي السائل *" : "Actual Weight (g) *"}</label>
                        <input
                          type="number"
                          step="any"
                          required
                          min="0.001"
                          placeholder="0.000"
                          value={adjWeight}
                          onChange={(e) => setAdjWeight(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-705 rounded p-1.5 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block mb-1">{isArabic ? "العيار أو البند *" : "Karat / Fineness *"}</label>
                        <input
                          type="number"
                          step="any"
                          required
                          min="1"
                          max="1000"
                          value={adjKarat}
                          onChange={(e) => setAdjKarat(e.target.value)}
                          placeholder="e.g. 21 or 875"
                          className="w-full bg-slate-800 border border-slate-705 rounded p-1.5 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block mb-1">{isArabic ? "سعر غرام عيار 21 *" : "Agreed 21 price *"}</label>
                        <input
                          type="number"
                          required
                          min="100"
                          value={adjPrice}
                          onChange={(e) => setAdjPrice(e.target.value)}
                          placeholder="6170"
                          className="w-full bg-slate-800 border border-slate-705 rounded p-1.5 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block mb-1">
                          {adjType === "gold_sold_to_dealer"
                            ? (isArabic ? "المستلم كاش فوراً" : "Cash Received")
                            : (isArabic ? "المدفوع كاش فوراً" : "Cash Paid")}
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0.00"
                          value={adjCash}
                          onChange={(e) => setAdjCash(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-705 rounded p-1.5 text-white font-mono text-left focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-3">
                    <label className="block mb-1">{isArabic ? "البيان / الوصف (اختياري)" : "Statement Memo (Optional)"}</label>
                    <input
                      type="text"
                      placeholder={isArabic ? "وصف مخصص يظهر بالتوريد" : "Custom ledger description"}
                      value={isArabic ? descAr : descEn}
                      onChange={(e) => {
                        if (isArabic) {
                          setDescAr(e.target.value);
                        } else {
                          setDescEn(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-705 rounded p-1.5 text-white focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded transition-all"
                    >
                      {isArabic ? "تأكيد وقيد المانيفست" : "Confirm Entry"}
                    </button>
                  </div>
                </form>
              </div>

              {/* REPORT STATEMENT LOGS */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-200">
                    {isArabic ? "كشف حساب بالتفصيل" : "Detailed Statement Activity"} - {isArabic ? currentDealer.nameAr : currentDealer.nameEn}
                  </h3>
                  <span className="text-[10px] bg-slate-800 text-amber-500 px-2 py-0.5 rounded font-bold">
                    {currentItems.length} {isArabic ? "عمليات مسجلة" : "operations found"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                        <th className="p-3">{isArabic ? "التاريخ" : "Date"}</th>
                        <th className="p-3 text-right">{isArabic ? "البيان" : "Description"}</th>
                        <th className="p-3 text-center">{isArabic ? "حركة النقد" : "Cash Amount"}</th>
                        <th className="p-3 text-center">{isArabic ? "وزن خام" : "Actual Gold"}</th>
                        <th className="p-3 text-center">{isArabic ? "العيار" : "Karat"}</th>
                        <th className="p-3 text-center">{isArabic ? "معادل عيار 21" : "Equiv 21g"}</th>
                        <th className="p-3 text-center">{isArabic ? "سعر الصرف" : "Value EGP"}</th>
                        <th className="p-3 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {currentItems.map((item) => {
                        return (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono text-[11px] whitespace-nowrap">{item.date}</td>
                            <td className="p-3 font-medium text-slate-100">{isArabic ? item.descriptionAr : item.descriptionEn}</td>
                            
                            {/* Cash column */}
                            <td className="p-3 text-center font-mono">
                              {item.cashAmount !== 0 ? (
                                <span className={item.cashAmount > 0 ? "text-emerald-400" : "text-rose-500"}>
                                  {item.cashAmount > 0 ? "+" : ""}{formatCurrency(item.cashAmount, isArabic)}
                                </span>
                              ) : (
                                <span className="text-slate-650">-</span>
                              )}
                            </td>

                            {/* Actual weight delivered or received */}
                            <td className="p-3 text-center font-mono">
                              {item.actualWeight !== 0 ? (
                                <span className={item.actualWeight > 0 ? "text-amber-400" : "text-slate-400"}>
                                  {item.actualWeight > 0 ? "+" : ""}{Math.abs(item.actualWeight).toFixed(2)}g
                                </span>
                              ) : (
                                <span className="text-slate-650">-</span>
                              )}
                            </td>

                            {/* Karat Code */}
                            <td className="p-3 text-center font-mono text-slate-400">
                              {item.karatValue > 0 ? item.karatValue : "-"}
                            </td>

                            {/* Equivalent target weight */}
                            <td className="p-3 text-center font-mono text-amber-500 font-bold">
                              {item.equivalentWeight21 !== 0 ? (
                                <span>{item.equivalentWeight21 > 0 ? "+" : ""}{item.equivalentWeight21.toFixed(3)}g</span>
                              ) : (
                                <span className="text-slate-650">-</span>
                              )}
                            </td>

                            {/* Gold financial value equivalents */}
                            <td className="p-3 text-center font-mono text-slate-400">
                              {item.goldValue > 0 ? (
                                <span className="text-amber-300">{formatCurrency(item.goldValue, isArabic)}</span>
                              ) : (
                                <span className="text-slate-650">-</span>
                              )}
                            </td>

                            {/* Deletion of individual entries */}
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  showConfirm(
                                    isArabic ? "هل تريد حذف هذه الحركة من كشف حساب التاجر؟" : "Delete this custom ledger entry?",
                                    () => {
                                      onDeleteStatementItem(item.id);
                                    }
                                  );
                                }}
                                className="text-slate-500 hover:text-rose-500 p-0.5 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
              {isArabic 
                ? "برجاء توفير أو تحديد سجل تاجر من القائمة الجانبية لعرض كشوف المبيعات والمقاصة" 
                : "Please select or add a dealer to view accounts and detailed statement ledger."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
