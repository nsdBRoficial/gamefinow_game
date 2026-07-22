/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GAMEFI_FEE_PERCENTAGE = parseFloat((import.meta as any).env?.VITE_GAMEFI_FEE_PERCENTAGE || "0.005"); // 0.5%
export const GAMEFI_TREASURY_PUBLIC_KEY = (import.meta as any).env?.VITE_GAMEFI_TREASURY_PUBLIC_KEY || "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B";
export const GAMEFI_TOKEN_CODE = (import.meta as any).env?.VITE_GAMEFI_TOKEN_CODE || "GAMEFI";
export const GAMEFI_TOKEN_ISSUER = (import.meta as any).env?.VITE_GAMEFI_TOKEN_ISSUER || "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B";

// Approximate rates in XLM for Testnet fee estimation
const ESTIMATED_XLM_RATES: Record<string, number> = {
  XLM: 1.0,
  USDW: 8.0,
  USDC: 8.0,
  BRW: 1.5,
  SRT: 0.5,
  GAMEFI: 2.0
};

/**
 * Calculates raw 0.5% fee on a given amount
 */
export const calculateGameFiFee = (amount: number): number => {
  if (isNaN(amount) || amount <= 0) return 0;
  return Number((amount * GAMEFI_FEE_PERCENTAGE).toFixed(7));
};

/**
 * Estimates the fee in XLM for any given asset transaction amount.
 * Fee is always paid in native XLM.
 */
export const estimateFeeInXlm = (assetCode: string, amount: number): number => {
  if (isNaN(amount) || amount <= 0) return 0;
  const rateInXlm = ESTIMATED_XLM_RATES[assetCode.toUpperCase()] || 1.0;
  const equivalentXlmValue = amount * rateInXlm;
  const feeInXlm = equivalentXlmValue * GAMEFI_FEE_PERCENTAGE;
  // Min fee floor of 0.01 XLM to ensure transaction validity
  return Number(Math.max(feeInXlm, 0.01).toFixed(7));
};

export interface FeeValidationResult {
  hasSufficientBalance: boolean;
  minRequired: number;
  currentXlm: number;
  missingXlm: number;
  feeInXlm: number;
}

/**
 * Validates if the user has sufficient XLM to pay the 0.5% GameFi fee
 * plus the required minimum Stellar base reserve.
 */
export const validateXlmBalanceForFee = (
  currentXlmBalance: number,
  feeInXlm: number,
  baseReserve: number = 1.5
): FeeValidationResult => {
  const minRequired = Number((feeInXlm + baseReserve).toFixed(7));
  const hasSufficientBalance = currentXlmBalance >= minRequired;
  const missingXlm = hasSufficientBalance ? 0 : Number((minRequired - currentXlmBalance).toFixed(7));

  return {
    hasSufficientBalance,
    minRequired,
    currentXlm: currentXlmBalance,
    missingXlm,
    feeInXlm
  };
};

/**
 * Formats fee display text for UI components
 */
export const formatFeeDisplay = (assetCode: string, amount: number): { feeXlmStr: string; feeXlm: number } => {
  const feeXlm = estimateFeeInXlm(assetCode, amount);
  return {
    feeXlmStr: `${feeXlm.toFixed(4)} XLM`,
    feeXlm
  };
};
