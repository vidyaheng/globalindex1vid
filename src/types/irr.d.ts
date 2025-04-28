declare module 'irr' {
    /**
     * Calculate the internal rate of return (IRR) for a series of cashflows.
     * @param cashflows An array of numbers representing cash inflows (+) and outflows (-).
     * @param guess An optional initial guess for the IRR calculation.
     * @returns The IRR as a decimal (e.g., 0.05 for 5%), or undefined if calculation fails.
     */
    export default function irr(cashflows: number[], guess?: number): number | undefined;
  }
  