/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Dealer,
  DealerStatementItem,
  PurchaseItem,
  SaleItem,
  PublicExpenseItem,
  PrivateWalletTransaction,
  AssayLogItem
} from "./types";

// Convert any karat to millesimal fineness (e.g., 21 -> 875, 24 -> 1000, 18 -> 750)
export function getMillesimalKarat(karat: number): number {
  if (karat <= 24) {
    return Number(((karat / 24) * 1000).toFixed(4));
  }
  return karat;
}

// Calculate Equivalent weight reference to standard Karat 21 / 875 fineness
export function calculateEquivalentWeight(
  weight: number,
  actualKarat: number
): number {
  if (!weight || !actualKarat) return 0;
  const millesimal = getMillesimalKarat(actualKarat);
  return Number(((millesimal / 875) * weight).toFixed(3));
}

// Format Currency based on selected locale
export function formatCurrency(amount: number, isArabic: boolean = true): string {
  const formatted = new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  if (isArabic) {
    return formatted.replace("جنيه مصري", "ج.م");
  }
  return formatted;
}

// Format Weight with 3 decimals
export function formatWeight(weight: number, isArabic: boolean = true): string {
  const num = new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(weight);
  
  return num + (isArabic ? " جرام" : " g");
}

// Initial state data following users exact requirements
export const INITIAL_DEALERS: Dealer[] = [
  {
    id: "d1",
    nameAr: "التاجر الكوني 1",
    nameEn: "Dealer One (Primary)",
    phone: "01002003004"
  }
];

export const INITIAL_DEALER_STATEMENTS: DealerStatementItem[] = [
  {
    id: "ds_1",
    date: "2026-06-12",
    type: "loan_received",
    descriptionAr: "الحصول على سلفة نقدية من التاجر",
    descriptionEn: "Received cash loan from dealer",
    cashAmount: 270000,
    actualWeight: 0,
    karatValue: 0,
    equivalentWeight21: 0,
    price21: 0,
    goldValue: 0
  },
  {
    id: "ds_2",
    date: "2026-06-13",
    type: "gold_sold_to_dealer",
    descriptionAr: "بيع وتسليم ذهب عيار 852 (تمت تسوية جزئية من السلفة)",
    descriptionEn: "Sold & delivered gold 852 Karat (offset against loan)",
    cashAmount: 0,
    actualWeight: 46.97,
    karatValue: 852,
    equivalentWeight21: 45.734, // (852 / 875) * 46.97
    price21: 6170,
    goldValue: 282176 // 45.734 * 6170
  }
];

export const INITIAL_PURCHASES: PurchaseItem[] = [
  {
    id: "p_init_1",
    date: "2026-06-12",
    customerName: "عميل الورشة الذهبي (أحمد)",
    actualWeight: 46.95,
    detectedKarat: 842,
    equivalentWeight21: 45.177, // (842 / 875) * 46.95
    price21: 6150,
    goldValue: 277839, // 45.177 * 6150
    assayFee: 200,
    brokerFee: 300
  }
];

export const INITIAL_SALES: SaleItem[] = [
  {
    id: "s_init_1",
    date: "2026-06-13",
    dealerId: "d1",
    actualWeight: 46.97,
    detectedKarat: 852,
    equivalentWeight21: 45.734,
    price21: 6170,
    goldValue: 282176
  }
];

export const INITIAL_EXPENSES: PublicExpenseItem[] = [
  {
    id: "e_init_1",
    date: "2026-06-12",
    titleAr: "إيجار المعمل والكهرباء الشهرية",
    titleEn: "Workshop Rent and Electricity Bill",
    category: "overhead",
    amount: 1500,
    notes: "سداد مصروفات عمومية للمحل"
  }
];

export const INITIAL_PRIVATE_WALLET_TRANSACTIONS: PrivateWalletTransaction[] = [
  {
    id: "w_1",
    date: "2026-06-11",
    type: "deposit",
    descriptionAr: "رأس المال المبدئي الافتتاحي للخزنة",
    descriptionEn: "Opening initial capital in private wallet",
    amount: 7657
  },
  {
    id: "w_2",
    date: "2026-06-12",
    type: "loan_cash_received",
    descriptionAr: "سلفة نقدية جارية من التاجر 1",
    descriptionEn: "Cash loan received from Dealer 1",
    amount: 270000
  },
  {
    id: "w_3",
    date: "2026-06-12",
    type: "deposit",
    descriptionAr: "إيداع مالي خاص إضافي من صاحب الصاغة",
    descriptionEn: "Additional private cash injection from owner",
    amount: 61600
  },
  {
    id: "w_4",
    date: "2026-06-12",
    type: "purchase_payment",
    descriptionAr: "شراء العيار الفعلي 842 من عميل الورشة الذهبي (أحمد)",
    descriptionEn: "Paid customer for gold purchase of weight 46.95g",
    amount: -277839
  },
  {
    id: "w_5",
    date: "2026-06-12",
    type: "assay_fee_income",
    descriptionAr: "رسم تحليل وششنة عيار 842",
    descriptionEn: "Assay / testing fee received from customer",
    amount: 200
  },
  {
    id: "w_6",
    date: "2026-06-12",
    type: "broker_fee_payment",
    descriptionAr: "عمولة السمسار لحركة شراء العيار 842",
    descriptionEn: "Broker fee for purchase transaction p_init_1",
    amount: -300
  }
];

export const INITIAL_ASSAY_LOGS: AssayLogItem[] = [
  {
    id: "al_1",
    date: "2026-06-12",
    customerName: "عميل الورشة الذهبي (أحمد)",
    actualWeight: 46.95,
    detectedKarat: 842,
    assayFee: 200
  }
];

// Helper to load state
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error("LocalStorage error loading key: " + key, e);
    return defaultValue;
  }
}

// Helper to save state
export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("LocalStorage error saving key: " + key, e);
  }
}
