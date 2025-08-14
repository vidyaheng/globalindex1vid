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

  // --- 👇 สร้างกระแสเงินสดสำหรับ IRR (Logic ใหม่ที่ถูกต้องและแม่นยำ) ---
  // สร้าง Array ว่างสำหรับ 17 ช่วงเวลา (t=0 ถึง t=16)
  const surrenderCashflows: number[] = Array(17).fill(0);
  const deathCashflows: number[] = Array(17).fill(0);

  for (let i = 0; i < 16; i++) {
      const yearData = yearlyData[i];
      const year = yearData.policyYear;

      // เงินจ่ายออก (เบี้ยประกัน) เกิดขึ้น "ต้นปี" (t = year - 1)
      if (yearData.premium > 0) {
          surrenderCashflows[year - 1] -= yearData.premium;
          deathCashflows[year - 1] -= yearData.premium;
      }

      // เงินรับเข้า (เงินคืน + ผลประโยชน์ภาษี ถ้าเลือก) เกิดขึ้น "ปลายปี" (t = year)
      const inflow = yearData.cashback + (includeTaxBenefitInIRR ? yearData.taxBenefit : 0);
      surrenderCashflows[year] += inflow;
      deathCashflows[year] += inflow;
  }

  // เงินก้อนสุดท้าย ณ "ปลายปีที่ 16" (t = 16)
  // สำหรับ IRR กรณีเวนคืน, เงินรับคือ "มูลค่าเวนคืนรวม" (หักลบเงินคืนปกติของปีนั้นออกก่อน)
  const lastYearInflowSurrender = yearlyData[15].cashback + (includeTaxBenefitInIRR ? yearlyData[15].taxBenefit : 0);
  surrenderCashflows[16] = surrenderCashflows[16] - lastYearInflowSurrender + yearlyData[15].totalSurrenderBenefit;
  
  // สำหรับ IRR กรณีเสียชีวิต, เงินรับคือ "ความคุ้มครองชีวิตรวม" (หักลบเงินคืนปกติของปีนั้นออกก่อน)
  const lastYearInflowDeath = yearlyData[15].cashback + (includeTaxBenefitInIRR ? yearlyData[15].taxBenefit : 0);
  deathCashflows[16] = deathCashflows[16] - lastYearInflowDeath + yearlyData[15].totalDeathBenefit;
  
  // คำนวณ IRR จากกระแสเงินสดที่สร้างขึ้น
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
}; // --- สิ้นสุดฟังก์ชัน performCalculations ---