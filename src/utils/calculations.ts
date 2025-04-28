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

  // --- สร้างกระแสเงินสดสำหรับ IRR (***ส่วนนี้มีการแก้ไข***) ---
  const surrenderCashflows: number[] = [];
  const deathCashflows: number[] = [];

  // เวลา 0: กระแสเงินสดจ่ายออกคือเบี้ยปีแรก
  surrenderCashflows.push(yearlyData.length > 0 ? -yearlyData[0].premium : 0);
  deathCashflows.push(yearlyData.length > 0 ? -yearlyData[0].premium : 0);

  // Loop สร้างกระแสเงินสด ณ เวลา 1 ถึง 16
  for (let i = 0; i < 16; i++) {
    if (!yearlyData[i]) continue;
    const yearData = yearlyData[i];
    const yearIndex = i + 1;

    // เงินจ่ายออก (-): เบี้ยประกันของ *ปีถัดไป*
    const nextPremiumOutflow = (yearIndex < 6 && yearlyData[yearIndex]) ? -yearlyData[yearIndex].premium : 0;

    // ***แก้ไขตรงนี้*** เงินรับเข้า (+): เงินคืน + (ถ้ากำหนด) ผลประโยชน์ทางภาษี
    const currentInflow = yearData.cashback + (includeTaxBenefitInIRR ? yearData.taxBenefit : 0);

    // --- คำนวณ Net Flow สำหรับ IRR เวนคืน ---
    // ใช้ currentInflow ที่คำนวณไว้
    let netFlowSurrender = nextPremiumOutflow + currentInflow;
    if (yearData.policyYear === 16) {
      netFlowSurrender += yearData.surrenderDividend; // Logic เดิม: ไม่รวม SV
    }
    surrenderCashflows.push(netFlowSurrender);

    // --- คำนวณ Net Flow สำหรับ IRR เสียชีวิต ---
    let netFlowDeath: number;
    if (yearData.policyYear === 16) {
      // Logic เดิม: ไม่รวม Cashback และ Tax Benefit ปี 16
      netFlowDeath = nextPremiumOutflow + yearData.deathBenefit + yearData.deathDividend;
    } else {
      // ปีก่อนหน้า: ใช้ currentInflow ที่คำนวณไว้
      netFlowDeath = nextPremiumOutflow + currentInflow;
    }
    deathCashflows.push(netFlowDeath);

  } // --- สิ้นสุด Loop สร้างกระแสเงินสด ---

  // คำนวณ IRR จากกระแสเงินสดที่สร้างขึ้น (ไม่ต้องแก้ไข)
  const irrSurrender = calculateIRR(surrenderCashflows);
  const irrDeath = calculateIRR(deathCashflows);

  // คืนผลลัพธ์ทั้งหมด (ไม่ต้องแก้ไข)
  return {
    yearlyData,
    totalPremium: totalPremiumPaid,
    totalTaxBenefit,
    totalCashback,
    irrSurrender,
    irrDeath,
  };
}; // --- สิ้นสุดฟังก์ชัน performCalculations ---