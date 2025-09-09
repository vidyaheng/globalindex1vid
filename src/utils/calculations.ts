// ในไฟล์ calculations.ts หรือไฟล์ที่เกี่ยวข้อง

import { FormData, CalculationResults, YearlyCalculationResult } from '../types';
import {
  SURRENDER_RATES_PER_1000,
  CASHBACK_RATES,
  SURRENDER_DIVIDEND_PERCENTAGES,
  DEATH_BENEFIT_RATES
} from './constants';
import { irr as irrFinancial } from 'financial';

// --- ฟังก์ชันคำนวณ IRR (ไม่ต้องแก้ไข) ---
const calculateIRR = (cashflows: number[]): number | null => {
  if (!cashflows || cashflows.length < 2) { return null; }
  const hasNegative = cashflows.some(cf => cf < 0);
  const hasPositive = cashflows.some(cf => cf > 0);
  if (!hasNegative || !hasPositive) { return null; }
  try {
    const rate = irrFinancial(cashflows);
    if (rate === undefined || isNaN(rate) || !isFinite(rate)) { return null; }
    return parseFloat((rate * 100).toFixed(2));
  } catch (error) {
    console.error("Error calculating IRR:", error);
    return null;
  }
};
// --- สิ้นสุดฟังก์ชันคำนวณ IRR ---


// --- ฟังก์ชันคำนวณหลัก (แทนที่ฟังก์ชันเดิมด้วยอันนี้) ---
export const performCalculations = (
    formData: FormData,
    includeTaxBenefitInIRR: boolean // <-- พารามิเตอร์ใหม่
): CalculationResults => {
  const { age, expectedReturn, taxBase, sumAssured, premium } = formData;
  const yearlyData: YearlyCalculationResult[] = [];
  let accumulatedCashback = 0;
  let totalPremiumPaid = 0;
  let totalTaxBenefit = 0; // ยังคำนวณไว้แสดงผลเสมอ
  let totalCashback = 0;
  const yearlyExpectedReturnRate = expectedReturn / 100;
  const taxRate = taxBase / 100;
  let actualTotalPremiumPaidToDate = 0;

  // --- Loop คำนวณผลประโยชน์รายปี (ปีที่ 1 ถึง 16 - ส่วนนี้ไม่ต้องแก้ไข) ---
  for (let year = 1; year <= 16; year++) {
    const currentAge = age + year - 1;
    const currentPremium = year <= 6 ? premium : 0;
    totalPremiumPaid += currentPremium;
    actualTotalPremiumPaidToDate += currentPremium;

    // คำนวณผลประโยชน์ทางภาษี (คำนวณไว้เสมอ สำหรับเก็บข้อมูล)
    const taxBenefit = currentPremium * taxRate;
    totalTaxBenefit += taxBenefit;

    // คำนวณเงินคืน
    const cashbackRate = CASHBACK_RATES[year] || 0;
    const cashback = cashbackRate * sumAssured;
    totalCashback += cashback;
    const displayAccumulatedCashback = accumulatedCashback + cashback;

    // (ส่วนคำนวณ Dividend, Surrender Value, Death Benefit ไม่ต้องแก้ไข)
    const interestFactorComponent = Math.pow(1 + yearlyExpectedReturnRate, year) - 1;
    const nonNegativeInterestFactor = Math.max(0, interestFactorComponent);
    const dividendBase = actualTotalPremiumPaidToDate * 0.8 * nonNegativeInterestFactor;
    const surrenderDividendRate = SURRENDER_DIVIDEND_PERCENTAGES[year] || 0;
    const surrenderDividend = year <= 6 ? 0 : dividendBase * surrenderDividendRate;
    const deathDividend = (year === 1) ? 0 : dividendBase;
    const surrenderRatePer1000 = SURRENDER_RATES_PER_1000[year] || 0;
    let surrenderValue = (sumAssured / 1000) * surrenderRatePer1000;
    if (year === 16) surrenderValue = 0;
    const deathRate = DEATH_BENEFIT_RATES[year] || (DEATH_BENEFIT_RATES[6] ?? 0);
    const deathBenefit = deathRate * sumAssured;

    // คำนวณผลประโยชน์รวมต่างๆ (สำหรับแสดงผล - ไม่ต้องแก้ไข)
    let totalSurrenderBenefit = accumulatedCashback + cashback + surrenderValue + surrenderDividend;
    if (year === 16) totalSurrenderBenefit = accumulatedCashback + cashback + surrenderDividend;
    let totalDeathBenefit = accumulatedCashback + deathBenefit + deathDividend;
    if (year !== 16) totalDeathBenefit += cashback;


    // จัดเก็บข้อมูลรายปี (ไม่ต้องแก้ไข)
    yearlyData.push({
      policyYear: year, age: currentAge, premium: currentPremium,
      taxBenefit, cashback, accumulatedCashback: displayAccumulatedCashback,
      surrenderDividend, surrenderValue, totalSurrenderBenefit,
      deathDividend, deathBenefit, totalDeathBenefit,
    });

    accumulatedCashback = displayAccumulatedCashback;
  } // --- สิ้นสุด Loop คำนวณรายปี ---

  // --- 👇 สร้างกระแสเงินสดสำหรับ IRR (ปรับปรุงใหม่ตามหลักการที่ถูกต้อง) ---
  const policyTermYears = 16;
  // สร้าง Array ว่างสำหรับ 17 ช่วงเวลา (t=0 ถึง t=16)
  const surrenderCashflows: number[] = Array(policyTermYears + 1).fill(0);
  const deathCashflows: number[] = Array(policyTermYears + 1).fill(0);

  // --- Loop สร้างกระแสเงินสดพื้นฐาน ---
  for (let i = 0; i < policyTermYears; i++) {
      const yearData = yearlyData[i];
      const timeIndexStartOfYear = i;   // t=0 (สำหรับปีที่ 1) ถึง t=15 (สำหรับปีที่ 16)
      const timeIndexEndOfYear = i + 1; // t=1 (สำหรับปีที่ 1) ถึง t=16 (สำหรับปีที่ 16)

      // 1. กระแสเงินสดออก (Premium): เกิดขึ้นต้นปี (t = year - 1)
      if (yearData.premium > 0) {
          surrenderCashflows[timeIndexStartOfYear] -= yearData.premium;
          deathCashflows[timeIndexStartOfYear] -= yearData.premium;
      }

      // 2. กระแสเงินสดเข้าปกติ (Cashback + Tax Benefit): เกิดขึ้นปลายปี (t = year)
      const regularInflow = yearData.cashback + (includeTaxBenefitInIRR ? yearData.taxBenefit : 0);
      surrenderCashflows[timeIndexEndOfYear] += regularInflow;
      deathCashflows[timeIndexEndOfYear] += regularInflow;
  }

  // --- 3. ปรับปรุงเงินก้อนสุดท้าย (Final Payout Adjustment) ณ ปลายปีที่ 16 (t = 16) ---
const finalYearData = yearlyData[policyTermYears - 1]; // ข้อมูลปีที่ 16

// --- กรณีที่ 1: IRR Surrender (ครบกำหนดสัญญา) ---
// (ส่วนนี้เหมือนเดิม: เพิ่มเงินปันผลเมื่อครบกำหนดสัญญาเข้าไป)
surrenderCashflows[policyTermYears] += finalYearData.surrenderDividend;


// --- กรณีที่ 2: IRR Death (ปรับปรุงตามเงื่อนไขใหม่) ---

// 2a. คำนวณเงินคืนปกติ + ภาษี ที่ถูกเพิ่มเข้าไปใน deathCashflows[16] ใน Loop ด้านบน
const regularInflowYear16 = finalYearData.cashback + (includeTaxBenefitInIRR ? finalYearData.taxBenefit : 0);

// 2b. ลบเงินคืนปกติ (ผลประโยชน์กรณีครบกำหนดสัญญา) ออกจากปีสุดท้าย
deathCashflows[policyTermYears] -= regularInflowYear16;

// 2c. เพิ่มผลประโยชน์กรณีเสียชีวิตเข้าไปแทนที่
const deathPayout = finalYearData.deathBenefit + finalYearData.deathDividend;
deathCashflows[policyTermYears] += deathPayout;

// --- คำนวณ IRR จากกระแสเงินสดที่สร้างขึ้นใหม่ ---
const irrSurrender = calculateIRR(surrenderCashflows);
const irrDeath = calculateIRR(deathCashflows);

return {
    yearlyData,
    totalPremium: totalPremiumPaid,
    totalTaxBenefit,
    totalCashback,
    irrSurrender,
    irrDeath,
};
}