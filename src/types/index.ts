export interface FormData {
    age: number;
    expectedReturn: number;
    taxBase: number;
    sumAssured: number;
    premium: number;
  }
  
  export interface YearlyCalculationResult {
    policyYear: number;
    age: number;
    premium: number;
    taxBenefit: number;
    cashback: number;
    accumulatedCashback: number;
    surrenderDividend: number;
    surrenderValue: number;
    totalSurrenderBenefit: number;
    deathDividend: number;
    deathBenefit: number;
    totalDeathBenefit: number;
  }
  
  export interface CalculationResults {
    yearlyData: YearlyCalculationResult[];
    totalPremium: number;
    totalTaxBenefit: number;
    totalCashback: number;
    irrSurrender: number | null; // IRR might not always be calculable
    irrDeath: number | null;
  }